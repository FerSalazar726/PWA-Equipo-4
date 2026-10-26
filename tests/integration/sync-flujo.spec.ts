import assert from "node:assert/strict";
import { test, beforeEach, afterEach } from "node:test";
import {
  enqueueOperation,
  getPendingOperations,
  readQueue,
  syncQueue,
} from "../../src/lib/sync/queue";
import { resolveConflict } from "../../src/lib/sync/conflict-policy";
import type { RemoteInspectionState } from "../../src/lib/sync/conflict-policy";
import { STORAGE_KEY } from "../../src/lib/storage/schema";
import type { InspectionPayload, SyncOperation } from "../../src/lib/storage/schema";
// Integracion: cola (queue) + esquema (llave de localStorage) + politica de
// conflictos, hablando con un "servidor" falso que se puede desconectar.
function crearAlmacenSimulado() {
  const datos = new Map<string, string>();
  return {
    getItem: (clave: string) => (datos.has(clave) ? datos.get(clave)! : null),
    setItem: (clave: string, valor: string) => {
      datos.set(clave, valor);
    },
    removeItem: (clave: string) => {
      datos.delete(clave);
    },
  };
}
function payload(resumen: string): InspectionPayload {
  return {
    location: "Laboratorio de Redes",
    date: "2026-10-02",
    inspector: "Tecnica A",
    status: "ok",
    statusLabel: "Sin incidencias",
    findings: 0,
    summary: resumen,
  };
}
function operacion(operationId: string, parcial: Partial<SyncOperation> = {}): SyncOperation {
  return {
    operationId,
    inspectionId: "inspection-001",
    type: "update",
    payload: payload("Version local"),
    createdAt: "2026-10-02T10:00:00.000Z",
    status: "pending",
    attempts: 0,
    ...parcial,
  };
}
function crearServidorFalso() {
  const estado = new Map<string, RemoteInspectionState>();
  const recibidas: string[] = [];
  let enLinea = true;
  const enviar = async (op: SyncOperation) => {
    if (!enLinea) throw new Error("Sin conexion");
    recibidas.push(op.operationId);
    const remoto = estado.get(op.inspectionId);
    if (remoto && resolveConflict(op, remoto).winner === "remote") {
      // El servidor ya tenia un cambio mas reciente: conserva el suyo.
      return { ok: true };
    }
    estado.set(op.inspectionId, {
      inspectionId: op.inspectionId,
      payload: op.payload,
      updatedAt: op.createdAt,
    });
    return { ok: true };
  };
  return {

    estado,
    recibidas,
    enviar,
    ponerEnLinea(valor: boolean) {
      enLinea = valor;
    },
  };
}
const global_ = globalThis as any;
beforeEach(() => {
  global_.window = { localStorage: crearAlmacenSimulado() };
});
afterEach(() => {
  delete global_.window;
});
test("sin conexion las operaciones se guardan en localStorage y al volver la conexion se sincronizan", async () => {
  const servidor = crearServidorFalso();
  servidor.ponerEnLinea(false);
  enqueueOperation(operacion("op-1", { type: "create", inspectionId: "inspection-100" }));
  enqueueOperation(operacion("op-2"));
  await syncQueue(servidor.enviar);
  const guardadas = JSON.parse(global_.window.localStorage.getItem(STORAGE_KEY));
  assert.equal(guardadas.length, 2, "la cola debe persistir en la llave del esquema");
  assert.deepEqual(servidor.recibidas, []);
  for (const op of getPendingOperations()) {
    assert.equal(op.status, "error");
    assert.equal(op.attempts, 1);
    assert.equal(op.lastError, "Sin conexion");
  }
  servidor.ponerEnLinea(true);
  await syncQueue(servidor.enviar);
  assert.equal(getPendingOperations().length, 0);
  assert.deepEqual(servidor.recibidas, ["op-1", "op-2"]);
  assert.ok(readQueue().every((op) => op.status === "synced"));
});
test("idempotencia: ni reintentar ni volver a encolar el mismo operationId reenvia la operacion", async () => {
  const servidor = crearServidorFalso();
  enqueueOperation(operacion("op-3"));
  await syncQueue(servidor.enviar);
  await syncQueue(servidor.enviar);
  enqueueOperation(operacion("op-3"));
  await syncQueue(servidor.enviar);
  assert.deepEqual(servidor.recibidas, ["op-3"]);
  assert.equal(readQueue().length, 1);
});
test("conflicto: si el servidor tiene un cambio mas reciente, gana el remoto y no se sobrescribe", async () => {
  const servidor = crearServidorFalso();
  servidor.estado.set("inspection-001", {
    inspectionId: "inspection-001",
    payload: payload("Version remota"),
    updatedAt: "2026-10-02T12:00:00.000Z",
  });
  enqueueOperation(operacion("op-4", { createdAt: "2026-10-02T08:00:00.000Z" }));
  await syncQueue(servidor.enviar);
  assert.equal(servidor.estado.get("inspection-001")?.payload.summary, "Version remota");
  assert.equal(getPendingOperations().length, 0);
});
test("conflicto: si el cambio local es mas reciente, el servidor se actualiza con el payload local", async () => {
  const servidor = crearServidorFalso();
  servidor.estado.set("inspection-001", {
    inspectionId: "inspection-001",
    payload: payload("Version remota"),

    updatedAt: "2026-10-02T08:00:00.000Z",
  });
  enqueueOperation(operacion("op-5", { createdAt: "2026-10-02T12:00:00.000Z" }));
  await syncQueue(servidor.enviar);
  assert.equal(servidor.estado.get("inspection-001")?.payload.summary, "Version local");
  assert.equal(getPendingOperations().length, 0);
});
test("limite de intentos: tras 3 fallos acumulados en varias sincronizaciones ya no se reintenta", async () => {
  let llamadas = 0;
  const siempreFalla = async () => {
    llamadas += 1;
    throw new Error("Sin conexion");
  };
  enqueueOperation(operacion("op-6"));
  for (let i = 0; i < 5; i += 1) {
    await syncQueue(siempreFalla);
  }
  assert.equal(llamadas, 3);
  const [op] = readQueue();
  assert.equal(op.attempts, 3);
  assert.equal(op.status, "error");
  assert.equal(op.lastError, "Sin conexion");
});
test("una operacion que falla no bloquea a las demas del lote", async () => {
  const enviar = async (op: SyncOperation) =>
    op.operationId === "op-mala" ? { ok: false, error: "500" } : { ok: true };
  enqueueOperation(operacion("op-mala"));
  enqueueOperation(operacion("op-buena"));
  await syncQueue(enviar);
  const cola = readQueue();
  assert.equal(cola.find((op) => op.operationId === "op-buena")?.status, "synced");
  assert.equal(cola.find((op) => op.operationId === "op-mala")?.status, "error");
  assert.equal(cola.find((op) => op.operationId === "op-mala")?.lastError, "500");
});

import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import {
  enqueueOperation,
  getPendingOperations,
  syncQueue,
} from "../src/lib/sync/queue";
import type { SyncOperation } from "../src/lib/storage/schema";
import { resolveConflict } from "../src/lib/sync/conflict-policy";

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

beforeEach(() => {
  (globalThis as any).window = { localStorage: createLocalStorageMock() };
});

function crearOperacion(parcial: Partial<SyncOperation> = {}): SyncOperation {
  return {
    operationId: "op-1",
    inspectionId: "inspection-local-1",
    type: "create",
    payload: {
      location: "Laboratorio de Redes",
      date: "2026-09-28",
      inspector: "Tecnica A",
      status: "ok",
      statusLabel: "Sin incidencias",
      findings: 0,
      summary: "Prueba",
    },
    createdAt: new Date().toISOString(),
    status: "pending",
    attempts: 0,
    ...parcial,
  };
}

test("enqueueOperation no duplica una operacion con el mismo operationId", () => {
  enqueueOperation(crearOperacion());
  enqueueOperation(crearOperacion());
  assert.equal(getPendingOperations().length, 1);
});

test("syncQueue marca como synced cuando el envio es exitoso", async () => {
  enqueueOperation(crearOperacion({ operationId: "op-2" }));
  await syncQueue(async () => ({ ok: true }));
  assert.equal(getPendingOperations().length, 0);
});

test("syncQueue reintenta y cuenta los intentos cuando falla", async () => {
  enqueueOperation(crearOperacion({ operationId: "op-3" }));
  await syncQueue(async () => ({ ok: false, error: "500" }));
  const pendientes = getPendingOperations();
  assert.equal(pendientes.length, 1);
  assert.equal(pendientes[0].attempts, 1);
  assert.equal(pendientes[0].status, "error");
});

test("syncQueue deja de reintentar despues del maximo de intentos", async () => {
  enqueueOperation(
    crearOperacion({ operationId: "op-4", attempts: 3, status: "error" })
  );
  let llamadas = 0;
  await syncQueue(async () => {
    llamadas += 1;
    return { ok: false, error: "500" };
  });
  assert.equal(llamadas, 0);
});

test("resolveConflict elige el cambio local si es mas reciente", () => {
  const local = crearOperacion({ createdAt: "2026-09-28T12:00:00.000Z" });
  const resultado = resolveConflict(local, {
    inspectionId: "inspection-local-1",
    payload: local.payload,
    updatedAt: "2026-09-28T10:00:00.000Z",
  });
  assert.equal(resultado.winner, "local");
});

test("resolveConflict elige el cambio remoto si es mas reciente", () => {
  const local = crearOperacion({ createdAt: "2026-09-28T08:00:00.000Z" });
  const resultado = resolveConflict(local, {
    inspectionId: "inspection-local-1",
    payload: local.payload,
    updatedAt: "2026-09-28T10:00:00.000Z",
  });
  assert.equal(resultado.winner, "remote");
});
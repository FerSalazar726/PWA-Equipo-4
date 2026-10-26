import assert from "node:assert/strict";
import { test, beforeEach, afterEach } from "node:test";
import {
  enqueueOperation,
  getPendingOperations,
  readQueue,
  removeOperation,
  updateOperation,
} from "../../src/lib/sync/queue";
import { STORAGE_KEY } from "../../src/lib/storage/schema";
import type { SyncOperation } from "../../src/lib/storage/schema";

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

function operacion(operationId: string, parcial: Partial<SyncOperation> = {}): SyncOperation {
  return {
    operationId,
    inspectionId: "inspection-001",
    type: "update",
    payload: {
      location: "Laboratorio de Redes",
      date: "2026-10-01",
      inspector: "Tecnica A",
      status: "ok",
      statusLabel: "Sin incidencias",
      findings: 0,
      summary: "Prueba",
    },
    createdAt: "2026-10-01T10:00:00.000Z",
    status: "pending",
    attempts: 0,
    ...parcial,
  };
}

const global_ = globalThis as any;

beforeEach(() => {
  global_.window = { localStorage: crearAlmacenSimulado() };
});

afterEach(() => {
  delete global_.window;
});

test("readQueue regresa [] cuando el contenido guardado no es JSON valido", () => {
  global_.window.localStorage.setItem(STORAGE_KEY, "{esto no es json");
  assert.deepEqual(readQueue(), []);
});

test("readQueue regresa [] cuando todavia no se ha guardado nada", () => {
  assert.deepEqual(readQueue(), []);
});

test("sin localStorage (servidor) la cola esta vacia y encolar no lanza error", () => {
  delete global_.window;
  assert.deepEqual(readQueue(), []);
  assert.doesNotThrow(() => enqueueOperation(operacion("op-servidor")));
  assert.deepEqual(getPendingOperations(), []);
});

test("updateOperation cambia solo la operacion indicada", () => {
  enqueueOperation(operacion("op-a"));
  enqueueOperation(operacion("op-b"));
  updateOperation("op-a", { status: "error", attempts: 2, lastError: "500" });
  const cola = readQueue();
  assert.equal(cola.find((op) => op.operationId === "op-a")?.attempts, 2);
  assert.equal(cola.find((op) => op.operationId === "op-b")?.attempts, 0);
});

test("removeOperation elimina solo la operacion indicada", () => {
  enqueueOperation(operacion("op-a"));
  enqueueOperation(operacion("op-b"));
  removeOperation("op-a");
  assert.deepEqual(readQueue().map((op) => op.operationId), ["op-b"]);
});

test("getPendingOperations incluye pending y error, y excluye synced", () => {
  enqueueOperation(operacion("op-pendiente", { status: "pending" }));
  enqueueOperation(operacion("op-error", { status: "error", attempts: 1 }));
  enqueueOperation(operacion("op-listo", { status: "synced" }));
  const ids = getPendingOperations().map((op) => op.operationId).sort();
  assert.deepEqual(ids, ["op-error", "op-pendiente"]);
});

test("una operacion ya sincronizada tampoco se duplica si se vuelve a encolar", () => {
  enqueueOperation(operacion("op-repetida", { status: "synced" }));
  enqueueOperation(operacion("op-repetida", { status: "pending" }));
  assert.equal(readQueue().length, 1);
  assert.equal(readQueue()[0].status, "synced");
});

test("si localStorage esta lleno (setItem lanza), encolar no rompe la aplicacion", () => {
  global_.window.localStorage.setItem = () => {
    throw new Error("QuotaExceededError");
  };
  const original = console.error;
  console.error = () => {};
  try {
    assert.doesNotThrow(() => enqueueOperation(operacion("op-lleno")));
  } finally {
    console.error = original;
  }
});
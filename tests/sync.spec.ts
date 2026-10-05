import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveConflict } from "../src/lib/sync/conflict-policy";
import { getPendingOperations } from "../src/lib/sync/queue";
import type { InspectionPayload, SyncOperation } from "../src/lib/storage/schema";

const localPayload: InspectionPayload = {
  inspectionId: "inspection-001",
  status: "attention",
  findings: 1,
  summary: "Cambio local",
};
const remotePayload: InspectionPayload = {
  inspectionId: "inspection-001",
  status: "ok",
  findings: 0,
  summary: "Cambio remoto",
};
const localOperation: SyncOperation = {
  operationId: "op-001",
  inspectionId: "inspection-001",
  payload: localPayload,
  createdAt: "2026-10-04T12:00:00.000Z",
  status: "pending",
};

test("resuelve el conflicto a favor del cambio local más reciente", () => {
  const result = resolveConflict(localOperation, {
    inspectionId: "inspection-001",
    payload: remotePayload,
    updatedAt: "2026-10-04T11:59:00.000Z",
  });
  assert.equal(result.winner, "local");
  assert.equal(result.payload, localPayload);
  assert.match(result.reason, /local/);
});

test("resuelve el conflicto a favor del cambio remoto más reciente", () => {
  const result = resolveConflict(localOperation, {
    inspectionId: "inspection-001",
    payload: remotePayload,
    updatedAt: "2026-10-04T12:01:00.000Z",
  });
  assert.equal(result.winner, "remote");
  assert.equal(result.payload, remotePayload);
  assert.match(result.reason, /remoto/);
});

test("si las fechas empatan, conserva el payload local", () => {
  const result = resolveConflict(localOperation, {
    inspectionId: "inspection-001",
    payload: remotePayload,
    updatedAt: localOperation.createdAt,
  });
  assert.equal(result.winner, "local");
  assert.equal(result.payload, localPayload);
});

test("rechaza timestamps inválidos para no elegir un ganador arbitrario", () => {
  assert.throws(
    () => resolveConflict({ ...localOperation, createdAt: "fecha inválida" }, {
      inspectionId: "inspection-001",
      payload: remotePayload,
      updatedAt: "2026-10-04T12:01:00.000Z",
    }),
    RangeError,
  );
});

test("cuenta solo las operaciones pending almacenadas", () => {
  const operations = [
    localOperation,
    { ...localOperation, operationId: "op-002", status: "done" },
    { ...localOperation, operationId: "op-003", status: "failed" },
    { ...localOperation, operationId: "op-004", status: "inFlight" },
  ];
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: { getItem: (key: string) => key === "inspection-sync-operations" ? JSON.stringify(operations) : null } },
  });
  try {
    assert.deepEqual(getPendingOperations(), [localOperation]);
  } finally {
    if (originalWindow === undefined) delete (globalThis as { window?: Window }).window;
    else Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
  }
});

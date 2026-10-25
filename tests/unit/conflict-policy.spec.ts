import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveConflict } from "../../src/lib/sync/conflict-policy";
import type { InspectionPayload, SyncOperation } from "../../src/lib/storage/schema";

const payloadLocal: InspectionPayload = {
  location: "Laboratorio de Redes",
  date: "2026-10-01",
  inspector: "Tecnica A",
  status: "attention",
  statusLabel: "Requiere atencion",
  findings: 2,
  summary: "Version local",
};

const payloadRemoto: InspectionPayload = {
  ...payloadLocal,
  status: "ok",
  statusLabel: "Sin incidencias",
  findings: 0,
  summary: "Version remota",
};

function operacion(createdAt: string): SyncOperation {
  return {
    operationId: "op-conflicto",
    inspectionId: "inspection-001",
    type: "update",
    payload: payloadLocal,
    createdAt,
    status: "pending",
    attempts: 0,
  };
}

test("si el cambio local es mas reciente, gana el local y conserva su payload", () => {
  const resultado = resolveConflict(operacion("2026-10-01T12:00:00.000Z"), {
    inspectionId: "inspection-001",
    payload: payloadRemoto,
    updatedAt: "2026-10-01T10:00:00.000Z",
  });
  assert.equal(resultado.winner, "local");
  assert.deepEqual(resultado.payload, payloadLocal);
});

test("si el cambio remoto es mas reciente, gana el remoto y conserva su payload", () => {
  const resultado = resolveConflict(operacion("2026-10-01T08:00:00.000Z"), {
    inspectionId: "inspection-001",
    payload: payloadRemoto,
    updatedAt: "2026-10-01T10:00:00.000Z",
  });
  assert.equal(resultado.winner, "remote");
  assert.deepEqual(resultado.payload, payloadRemoto);
});

test("en un empate exacto gana el local para no descartar la edicion del usuario", () => {
  const instante = "2026-10-01T10:00:00.000Z";
  const resultado = resolveConflict(operacion(instante), {
    inspectionId: "inspection-001",
    payload: payloadRemoto,
    updatedAt: instante,
  });
  assert.equal(resultado.winner, "local");
});

test("compara instantes reales, no texto: dos zonas horarias del mismo momento empatan", () => {
  const resultado = resolveConflict(operacion("2026-10-01T12:00:00.000-06:00"), {
    inspectionId: "inspection-001",
    payload: payloadRemoto,
    updatedAt: "2026-10-01T18:00:00.000Z",
  });
  assert.equal(resultado.winner, "local");
});

test("lanza RangeError si la fecha local no es valida", () => {
  assert.throws(
    () =>
      resolveConflict(operacion("no-es-fecha"), {
        inspectionId: "inspection-001",
        payload: payloadRemoto,
        updatedAt: "2026-10-01T10:00:00.000Z",
      }),
    RangeError
  );
});

test("lanza RangeError si la fecha remota no es valida", () => {
  assert.throws(
    () =>
      resolveConflict(operacion("2026-10-01T10:00:00.000Z"), {
        inspectionId: "inspection-001",
        payload: payloadRemoto,
        updatedAt: "tampoco-es-fecha",
      }),
    RangeError
  );
});
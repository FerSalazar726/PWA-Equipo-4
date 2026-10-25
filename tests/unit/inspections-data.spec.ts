import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getInspectionById,
  getInspections,
  inspections,
} from "../../src/lib/data/inspections";

test("los ids de las inspecciones sinteticas son unicos", () => {
  const ids = inspections.map((inspeccion) => inspeccion.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("ninguna inspeccion tiene campos de texto vacios", () => {
  for (const inspeccion of inspections) {
    for (const campo of ["id", "location", "date", "inspector", "statusLabel", "summary"] as const) {
      assert.ok(inspeccion[campo].trim().length > 0, `${inspeccion.id}: ${campo} vacio`);
    }
  }
});

test("las fechas tienen formato AAAA-MM-DD y son fechas reales", () => {
  for (const inspeccion of inspections) {
    assert.match(inspeccion.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isFinite(Date.parse(inspeccion.date)), `${inspeccion.id}: fecha invalida`);
  }
});

test("el estado es coherente con los hallazgos: ok sin hallazgos, attention con hallazgos", () => {
  for (const inspeccion of inspections) {
    assert.ok(Number.isInteger(inspeccion.findings) && inspeccion.findings >= 0);
    if (inspeccion.status === "ok") assert.equal(inspeccion.findings, 0, inspeccion.id);
    else assert.ok(inspeccion.findings > 0, inspeccion.id);
  }
});

test("getInspectionById encuentra cada inspeccion por su id", async () => {
  for (const esperada of inspections) {
    assert.deepEqual(await getInspectionById(esperada.id), esperada);
  }
});

test("getInspectionById es exacto: no encuentra ids parciales ni con otra capitalizacion", async () => {
  assert.equal(await getInspectionById("inspection-00"), null);
  assert.equal(await getInspectionById("INSPECTION-001"), null);
  assert.equal(await getInspectionById(""), null);
});

test("getInspections conserva el orden de los datos sinteticos", async () => {
  const lista = await getInspections();
  assert.deepEqual(lista.map((inspeccion) => inspeccion.id), inspections.map((inspeccion) => inspeccion.id));
});
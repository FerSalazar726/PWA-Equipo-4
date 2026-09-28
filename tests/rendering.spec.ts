import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import {
  getInspections,
  getInspectionById,
} from "../src/lib/data/inspections";

test("getInspections regresa los 3 registros sinteticos", async () => {
  const datos = await getInspections();
  assert.equal(datos.length, 3);
});

test("getInspectionById regresa la inspeccion correcta", async () => {
  const datos = await getInspectionById("inspection-002");
  assert.ok(datos);
  assert.equal(datos?.location, "Laboratorio de Electrónica");
});

test("getInspectionById regresa null si el id no existe", async () => {
  const datos = await getInspectionById("no-existe");
  assert.equal(datos, null);
});

const listadoPath = path.join(
  process.cwd(),
  "src/app/inspecciones/page.tsx"
);
const detallePath = path.join(
  process.cwd(),
  "src/app/inspecciones/[id]/page.tsx"
);
const listadoSource = fs.readFileSync(listadoPath, "utf-8");
const detalleSource = fs.readFileSync(detallePath, "utf-8");

// La directiva debe ser lo primero del archivo; asi un comentario que
// mencione "use client" no cuenta como directiva.
const directivaUseClient = /^\s*["']use client["']/;

test("el listado NO declara use client (se renderiza en el servidor)", () => {
  assert.doesNotMatch(listadoSource, directivaUseClient);
});

test("el detalle SI declara use client (se renderiza en el navegador)", () => {
  assert.match(detalleSource, /"use client"/);
});

test("el detalle usa fetch para pedir los datos al navegador", () => {
  assert.match(detalleSource, /fetch\(/);
});
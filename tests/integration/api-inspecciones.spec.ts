import "./helpers/alias";
import assert from "node:assert/strict";
import { test } from "node:test";
import { GET } from "../../src/app/api/inspecciones/[id]/route";
import { inspections } from "../../src/lib/data/inspections";
// Integracion: manejador real de la ruta API + capa de datos real.
async function pedir(id: string) {
  const respuesta = await GET(
    new Request(`http://localhost/api/inspecciones/${id}`),
    { params: { id } }
  );
  return { status: respuesta.status, cuerpo: await respuesta.json() };
}
test("la API responde 200 con la inspeccion completa para cada id existente", async () => {
  for (const esperada of inspections) {
    const { status, cuerpo } = await pedir(esperada.id);
    assert.equal(status, 200, esperada.id);
    assert.deepEqual(cuerpo, esperada);
  }
});
test("la API responde 404 con un mensaje claro si el id no existe", async () => {
  const { status, cuerpo } = await pedir("no-existe");
  assert.equal(status, 404);
  assert.match(cuerpo.error, /No se encontro la inspeccion/);
});
test("la API no responde datos de otra inspeccion con ids parecidos", async () => {
  for (const id of ["inspection-00", "inspection-0011", "INSPECTION-001"]) {
    const { status } = await pedir(id);
    assert.equal(status, 404, id);
  }
});
test("la respuesta de la API es JSON", async () => {
  const respuesta = await GET(
    new Request("http://localhost/api/inspecciones/inspection-001"),
    { params: { id: "inspection-001" } }
  );
  assert.match(respuesta.headers.get("content-type") ?? "", /application\/json/);
});

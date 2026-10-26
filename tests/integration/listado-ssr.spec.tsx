import "./helpers/alias";
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import InspeccionesPage from "../../src/app/inspecciones/page";
import { inspections } from "../../src/lib/data/inspections";
// Integracion: la pagina del listado (componente de servidor) + la capa de datos.
async function renderizarListado(): Promise<string> {
  // La pagina es asincrona: primero se resuelve y despues se convierte a HTML.
  const elemento = await InspeccionesPage();
  return renderToStaticMarkup(elemento);
}
test("el listado muestra un enlace al detalle por cada inspeccion de la capa de datos", async () => {
  const html = await renderizarListado();
  for (const inspeccion of inspections) {
    assert.ok(
      html.includes(`href="/inspecciones/${inspeccion.id}"`),
      `falta el enlace de ${inspeccion.id}`
    );
    assert.ok(html.includes(inspeccion.location), `falta ${inspeccion.location}`);
    assert.ok(html.includes(inspeccion.date), `falta la fecha de ${inspeccion.id}`);
  }
});
test("el listado ya trae los datos en el HTML (no depende de JavaScript del navegador)", async () => {
  const html = await renderizarListado();
  assert.equal((html.match(/<li>/g) ?? []).length, inspections.length);
  assert.doesNotMatch(html, /loading-skeleton/);
});
test("el listado tiene un unico main y un titulo principal", async () => {
  const html = await renderizarListado();
  assert.equal((html.match(/<main\b/g) ?? []).length, 1);
  assert.equal((html.match(/<h1>/g) ?? []).length, 1);
});

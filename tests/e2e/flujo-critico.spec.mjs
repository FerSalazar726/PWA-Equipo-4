import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { iniciarServidor } from "./helpers/server.mjs";

// E2E por HTTP contra el servidor de produccion: listado -> detalle -> API.
let servidor;

before(async () => {
  servidor = await iniciarServidor();
});

after(async () => {
  await servidor?.detener();
});

const pedir = (ruta) => fetch(`${servidor.baseUrl}${ruta}`);

async function enlacesDelListado() {
  const html = await (await pedir("/inspecciones")).text();
  const enlaces = [...html.matchAll(/href="(\/inspecciones\/[^"]+)"/g)].map((m) => m[1]);
  return { html, enlaces: [...new Set(enlaces)] };
}

test("la portada responde 200 como HTML y muestra el titulo del producto", async () => {
  const respuesta = await pedir("/");
  assert.equal(respuesta.status, 200);
  assert.match(respuesta.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await respuesta.text(), /Inspecciones de laboratorio/);
});

test("el listado trae las 3 inspecciones ya dentro del HTML (SSR)", async () => {
  const { html, enlaces } = await enlacesDelListado();
  assert.equal(enlaces.length, 3);
  for (const laboratorio of ["Redes", "Electrónica", "Software"]) {
    assert.ok(html.includes(`Laboratorio de ${laboratorio}`), `falta Laboratorio de ${laboratorio}`);
  }
});

test("el listado se genera en cada peticion: no queda cacheado como pagina estatica", async () => {
  const respuesta = await pedir("/inspecciones");
  assert.equal(respuesta.status, 200);
  assert.doesNotMatch(respuesta.headers.get("cache-control") ?? "", /s-maxage/);
});

test("flujo critico: cada enlace del listado abre su detalle y su API devuelve la misma inspeccion", async () => {
  const { html: listado, enlaces } = await enlacesDelListado();
  assert.equal(enlaces.length, 3);
  for (const enlace of enlaces) {
    const id = enlace.split("/").pop();
    const detalle = await pedir(enlace);
    assert.equal(detalle.status, 200, enlace);
    assert.match(await detalle.text(), /loading-skeleton/, "el detalle (CSR) inicia mostrando la carga");
    const api = await pedir(`/api/inspecciones/${id}`);
    assert.equal(api.status, 200, id);
    const inspeccion = await api.json();
    assert.equal(inspeccion.id, id);
    assert.ok(listado.includes(inspeccion.location), `el listado no menciona ${inspeccion.location}`);
  }
});

test("la API responde 404 con JSON para una inspeccion inexistente", async () => {
  const respuesta = await pedir("/api/inspecciones/no-existe");
  assert.equal(respuesta.status, 404);
  assert.match(respuesta.headers.get("content-type") ?? "", /application\/json/);
  assert.match((await respuesta.json()).error, /No se encontro la inspeccion/);
});

test("limite conocido: el detalle de un id inexistente responde 200 porque el 404 se resuelve en el navegador", async () => {
  const respuesta = await pedir("/inspecciones/no-existe");
  assert.equal(respuesta.status, 200);
});

test("una ruta que no existe responde 404", async () => {
  const respuesta = await pedir("/ruta-que-no-existe");
  assert.equal(respuesta.status, 404);
});

import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { iniciarServidor } from "./helpers/server.mjs";

// E2E por HTTP: lo que el navegador necesita para instalar la PWA y usarla sin conexion.
let servidor;

before(async () => {
  servidor = await iniciarServidor();
});

after(async () => {
  await servidor?.detener();
});

const pedir = (ruta) => fetch(`${servidor.baseUrl}${ruta}`);

test("el manifest se sirve como JSON, es instalable y sus iconos se descargan", async () => {
  const respuesta = await pedir("/manifest.webmanifest");
  assert.equal(respuesta.status, 200);
  const manifest = await respuesta.json();
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.name);
  assert.ok(manifest.icons.length >= 2);
  for (const icono of manifest.icons) {
    const imagen = await pedir(icono.src);
    assert.equal(imagen.status, 200, icono.src);
    assert.match(imagen.headers.get("content-type") ?? "", /image\/png/, icono.src);
  }
});

test("el service worker se sirve como JavaScript desde la raiz y maneja fetch", async () => {
  const respuesta = await pedir("/sw.js");
  assert.equal(respuesta.status, 200);
  assert.match(respuesta.headers.get("content-type") ?? "", /javascript/);
  assert.match(await respuesta.text(), /addEventListener\(\s*["']fetch["']/);
});

test("la pagina offline se sirve como HTML", async () => {
  const respuesta = await pedir("/offline.html");
  assert.equal(respuesta.status, 200);
  assert.match(respuesta.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await respuesta.text(), /Sin conexion/);
});

test("la portada enlaza el manifest y declara el color del tema", async () => {
  const html = await (await pedir("/")).text();
  assert.match(html, /<link[^>]*rel="manifest"[^>]*>/);
  assert.match(html, /href="\/manifest\.webmanifest"/);
  assert.match(html, /<meta[^>]*name="theme-color"[^>]*content="#173d35"/);
});

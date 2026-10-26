import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
// Integracion de configuracion: manifest, iconos, service worker, pagina
// offline y layout tienen que apuntar a archivos que de verdad existen.
const raiz = process.cwd();
const publico = (...partes: string[]) => path.join(raiz, "public", ...partes);
const leer = (...partes: string[]) => fs.readFileSync(path.join(raiz, ...partes), "utf-8");
const manifest = JSON.parse(fs.readFileSync(publico("manifest.webmanifest"), "utf-8"));
const sw = fs.readFileSync(publico("sw.js"), "utf-8");
const FIRMA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
test("cada icono del manifest existe en public/ y es un PNG real", () => {
  for (const icono of manifest.icons) {
    const archivo = publico(icono.src.replace(/^\//, ""));
    assert.ok(fs.existsSync(archivo), `no existe ${icono.src}`);
    assert.deepEqual([...fs.readFileSync(archivo).subarray(0, 8)], FIRMA_PNG, icono.src);
  }
});
test("el tamano declarado de cada icono coincide con las dimensiones reales del PNG", () => {
  for (const icono of manifest.icons) {
    const datos = fs.readFileSync(publico(icono.src.replace(/^\//, "")));
    const [ancho, alto] = icono.sizes.split("x").map(Number);
    assert.equal(datos.readUInt32BE(16), ancho, `${icono.src}: ancho`);
    assert.equal(datos.readUInt32BE(20), alto, `${icono.src}: alto`);
  }
});
test("todo lo que el service worker precachea existe en public/ (o es la raiz)", () => {
  const bloque = sw.match(/PRECACHE_URLS\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(bloque, "no se encontro PRECACHE_URLS en sw.js");
  const urls = [...bloque[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
  assert.ok(urls.length > 0);
  for (const url of urls) {
    if (url === "/") continue;
    assert.ok(fs.existsSync(publico(url.replace(/^\//, ""))), `sw.js precachea ${url} pero no existe`);
  }
});
test("la pagina de respaldo que usa el service worker existe y es HTML completo", () => {
  const destino = sw.match(/OFFLINE_URL\s*=\s*["']([^"']+)["']/);
  assert.ok(destino, "no se encontro OFFLINE_URL en sw.js");
  const html = fs.readFileSync(publico(destino[1].replace(/^\//, "")), "utf-8");
  assert.match(html, /<html[^>]*lang="es"/);
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.doesNotMatch(html, /https?:\/\//, "la pagina offline no debe depender de recursos de internet");
});
test("el manifest arranca dentro de su scope y el scope cubre /sw.js", () => {
  assert.equal(manifest.scope, "/");
  assert.ok(manifest.start_url.startsWith(manifest.scope));
});
test("el layout enlaza el manifest y la app registra el mismo /sw.js que existe en public/", () => {
  const layout = leer("src", "app", "layout.tsx");
  assert.ok(layout.includes(`manifest: "/manifest.webmanifest"`));
  assert.ok(layout.includes("<RegisterSW />"));
  assert.ok(leer("src", "lib", "pwa", "register-service-worker.ts").includes(`register("/sw.js")`));
  assert.ok(fs.existsSync(publico("sw.js")));
});

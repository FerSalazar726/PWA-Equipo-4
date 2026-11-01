import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { iniciarServidor } from "./helpers/server.mjs";

// E2E de seguridad por HTTP contra `next start`: cabeceras reales, robots.txt,
// ids maliciosos, archivos que NO deben servirse y metodos no permitidos.
let servidor;

before(async () => {
  servidor = await iniciarServidor();
});

after(async () => {
  await servidor?.detener();
});

const pedir = (ruta, opciones) => fetch(`${servidor.baseUrl}${ruta}`, opciones);

const CABECERAS_FIJAS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "same-origin",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
};

const RUTAS_CON_CABECERAS = [
  "/",
  "/inspecciones",
  "/inspecciones/inspection-001",
  "/api/inspecciones/inspection-001",
  "/sw.js",
  "/manifest.webmanifest",
  "/robots.txt",
];

test("las paginas, la API y el service worker llevan las cabeceras de seguridad", async () => {
  for (const ruta of RUTAS_CON_CABECERAS) {
    const respuesta = await pedir(ruta);
    assert.equal(respuesta.status, 200, ruta);
    for (const [nombre, valor] of Object.entries(CABECERAS_FIJAS)) {
      assert.equal(respuesta.headers.get(nombre), valor, `${ruta}: ${nombre}`);
    }
    assert.ok(respuesta.headers.get("content-security-policy"), `${ruta}: falta CSP`);
    assert.ok(respuesta.headers.get("permissions-policy"), `${ruta}: falta Permissions-Policy`);
  }
});

test("la CSP de produccion limita todo a 'self' y no permite eval", async () => {
  const csp = (await pedir("/")).headers.get("content-security-policy") ?? "";
  const esperadas = [
    "default-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  for (const directiva of esperadas) {
    assert.ok(csp.includes(directiva), `falta: ${directiva}`);
  }
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.doesNotMatch(csp, /https?:/);
  assert.doesNotMatch(csp, /(^|\s)\*(\s|;|$)/);
});

test("la politica de permisos niega camara, microfono y ubicacion", async () => {
  const politica = (await pedir("/")).headers.get("permissions-policy") ?? "";
  for (const permiso of ["camera", "microphone", "geolocation"]) {
    assert.ok(politica.includes(`${permiso}=()`), permiso);
  }
});

test("el servidor no anuncia su tecnologia, no abre CORS a otros sitios y no establece cookies", async () => {
  for (const ruta of ["/", "/api/inspecciones/inspection-001"]) {
    const respuesta = await pedir(ruta, { headers: { Origin: "https://sitio-externo.example" } });
    assert.equal(respuesta.headers.get("x-powered-by"), null, ruta);
    assert.equal(respuesta.headers.get("access-control-allow-origin"), null, ruta);
    assert.equal(respuesta.headers.get("set-cookie"), null, ruta);
  }
});

test("robots.txt se sirve como texto y bloquea las rutas internas", async () => {
  const respuesta = await pedir("/robots.txt");
  assert.equal(respuesta.status, 200);
  assert.match(respuesta.headers.get("content-type") ?? "", /text\/plain/);
  const texto = await respuesta.text();
  assert.match(texto, /^User-agent: \*$/m);
  assert.match(texto, /^Disallow: \/api\/$/m);
});

test("ids con inyeccion o formato invalido reciben el mismo 404 JSON y no se reflejan", async () => {
  const referencia = await pedir("/api/inspecciones/inspection-999");
  assert.equal(referencia.status, 404);
  const cuerpoReferencia = await referencia.text();
  const maliciosos = ["' OR 1=1 --", "<img src=x>", "INSPECTION-001", "a".repeat(500)];
  for (const id of maliciosos) {
    const respuesta = await pedir(`/api/inspecciones/${encodeURIComponent(id)}`);
    assert.equal(respuesta.status, 404, id);
    assert.match(respuesta.headers.get("content-type") ?? "", /application\/json/);
    const cuerpo = await respuesta.text();
    assert.equal(cuerpo, cuerpoReferencia, "no debe dar pistas distintas");
    assert.ok(!cuerpo.includes("<img"), "no debe reflejar la entrada");
  }
});

test("un intento de recorrido de rutas no devuelve archivos del servidor", async () => {
  const respuesta = await pedir(`/api/inspecciones/${encodeURIComponent("../../etc/passwd")}`);
  assert.equal(respuesta.status, 404);
  assert.doesNotMatch(await respuesta.text(), /root:/);
});

test("los archivos privados del proyecto no se sirven por HTTP", async () => {
  const privadas = [
    "/.env",
    "/.env.example",
    "/.git/config",
    "/package.json",
    "/src/lib/data/inspections.ts",
    "/next.config.mjs",
  ];
  for (const ruta of privadas) {
    const respuesta = await pedir(ruta);
    assert.equal(respuesta.status, 404, ruta);
  }
});

test("la API solo acepta GET: POST, PUT y DELETE no estan permitidos", async () => {
  for (const metodo of ["POST", "PUT", "DELETE"]) {
    const respuesta = await pedir("/api/inspecciones/inspection-001", { method: metodo });
    assert.equal(respuesta.status, 405, metodo);
  }
});

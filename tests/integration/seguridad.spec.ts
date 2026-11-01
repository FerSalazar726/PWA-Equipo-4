import "./helpers/alias";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { test, beforeEach, afterEach } from "node:test";
import type { NextRequest } from "next/server";
import { GET } from "../../src/app/api/inspecciones/[id]/route";
import { config, middleware } from "../../src/middleware";
import { getSecurityHeaders } from "../../src/lib/security/headers";
import { STORAGE_KEY } from "../../src/lib/storage/schema";
import type { SyncOperation } from "../../src/lib/storage/schema";
import { readQueue, syncQueue } from "../../src/lib/sync/queue";
// Integracion de seguridad: middleware real + ruta API real + cola real +
// archivos de configuracion del repositorio. No usa navegador.
const raiz = process.cwd();
const leer = (ruta: string) => readFileSync(path.join(raiz, ruta), "utf8");
function archivosDe(carpeta: string, extensiones: string[]): string[] {
  const lista: string[] = [];
  for (const nombre of readdirSync(path.join(raiz, carpeta))) {
    const relativa = `${carpeta}/${nombre}`;
    if (statSync(path.join(raiz, relativa)).isDirectory()) lista.push(...archivosDe(relativa, extensiones));
    else if (extensiones.includes(path.extname(nombre))) lista.push(relativa);
  }
  return lista;
}
// ---------- Middleware ----------
function ejecutarMiddleware(entorno: string) {
  const env = process.env as Record<string, string | undefined>;
  const anterior = env.NODE_ENV;
  env.NODE_ENV = entorno;
  try {
    return middleware(new Request("http://localhost/") as unknown as NextRequest);
  } finally {
    if (anterior === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = anterior;
  }
}
test("el middleware agrega todas las cabeceras de seguridad en produccion", () => {
  const respuesta = ejecutarMiddleware("production");
  for (const { key, value } of getSecurityHeaders({ development: false })) {
    assert.equal(respuesta.headers.get(key), value, key);
  }
  assert.doesNotMatch(respuesta.headers.get("content-security-policy") ?? "", /unsafe-eval/);
});
test("en desarrollo el middleware permite lo que Next necesita para recargar", () => {
  const respuesta = ejecutarMiddleware("development");
  assert.match(respuesta.headers.get("content-security-policy") ?? "", /unsafe-eval/);
});
test("el middleware cubre paginas, API y service worker, pero no los archivos internos de Next", () => {
  const [patron] = config.matcher;
  const regex = new RegExp(`^${patron}$`);
  const rutas = ["/", "/inspecciones", "/api/inspecciones/inspection-001", "/sw.js", "/manifest.webmanifest", "/robots.txt"];
  for (const ruta of rutas) {
    assert.ok(regex.test(ruta), `debe cubrir ${ruta}`);
  }
  assert.ok(!regex.test("/_next/static/chunks/main.js"));
});
// ---------- Ruta API ----------
async function pedir(id: string) {
  const respuesta = await GET(new Request("http://localhost/api/inspecciones/x"), { params: { id } });
  return { status: respuesta.status, texto: await respuesta.text() };
}
test("los ids maliciosos reciben la misma respuesta que un id inexistente y no se reflejan", async () => {
  const referencia = await pedir("inspection-999");
  assert.equal(referencia.status, 404);

  const maliciosos = ["../../etc/passwd", "' OR 1=1 --", "<script>alert(1)</script>", "INSPECTION-001", "a".repeat(500)];
  for (const id of maliciosos) {
    const resultado = await pedir(id);
    assert.equal(resultado.status, 404, id);
    assert.equal(resultado.texto, referencia.texto, "no debe dar pistas distintas");
    assert.ok(!resultado.texto.includes(id.slice(0, 20)), "no debe reflejar la entrada");
  }
});
test("un id valido sigue funcionando despues de agregar la validacion", async () => {
  const resultado = await pedir("inspection-001");
  assert.equal(resultado.status, 200);
  assert.equal(JSON.parse(resultado.texto).id, "inspection-001");
});
// ---------- Cola manipulada + sincronizacion ----------
function crearAlmacenSimulado() {
  const datos = new Map<string, string>();
  return {
    getItem: (clave: string) => (datos.has(clave) ? datos.get(clave)! : null),
    setItem: (clave: string, valor: string) => {
      datos.set(clave, valor);
    },
    removeItem: (clave: string) => {
      datos.delete(clave);
    },
  };
}
const payload = {
  location: "Laboratorio de Redes",
  date: "2026-10-02",
  inspector: "Tecnica A",
  status: "ok",
  statusLabel: "Sin incidencias",
  findings: 0,
  summary: "Version local",
};
function operacion(operationId: string, parcial: Record<string, unknown> = {}): SyncOperation {
  return {
    operationId,
    inspectionId: "inspection-001",
    type: "update",
    payload,
    createdAt: "2026-10-02T10:00:00.000Z",
    status: "pending",
    attempts: 0,
    ...parcial,
  } as SyncOperation;
}
const global_ = globalThis as any;
beforeEach(() => {
  global_.window = { localStorage: crearAlmacenSimulado() };
});
afterEach(() => {
  delete global_.window;
});
test("syncQueue nunca envia al servidor una operacion manipulada en localStorage", async () => {
  const manipuladas = [
    operacion("op-ruta", { inspectionId: "../../admin" }),
    operacion("op-pii", { payload: { ...payload, summary: "contacto persona@ejemplo.com" } }),
    operacion("op-html", { payload: { ...payload, summary: "<img src=x onerror=alert(1)>" } }),
    operacion("op-extra", { rol: "admin" }),
  ];
  global_.window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...manipuladas, operacion("op-buena")]));
  const enviadas: string[] = [];
  await syncQueue(async (op) => {
    enviadas.push(op.operationId);
    return { ok: true };
  });
  assert.deepEqual(enviadas, ["op-buena"]);

  assert.deepEqual(readQueue().map((op) => op.operationId), ["op-buena"]);
});
test("con localStorage dañado (no es una lista) la sincronizacion no truena", async () => {
  global_.window.localStorage.setItem(STORAGE_KEY, '{"a":1}');
  const enviadas: string[] = [];
  await assert.doesNotReject(() =>
    syncQueue(async (op) => {
      enviadas.push(op.operationId);
      return { ok: true };
    })
  );
  assert.deepEqual(enviadas, []);
});
// ---------- Archivos de configuracion ----------
test("robots.txt existe, bloquea rutas internas y no revela rutas sensibles", () => {
  assert.ok(existsSync(path.join(raiz, "public/robots.txt")));
  const robots = leer("public/robots.txt");
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Disallow: \/api\/$/m);
  assert.doesNotMatch(robots, /\.env|secret|admin|password|token/i);
});
test(".gitignore ignora los .env y .env.example es solo una plantilla sin valores", () => {
  const gitignore = leer(".gitignore");
  assert.match(gitignore, /^\.env\*$/m);
  assert.match(gitignore, /^!\.env\.example$/m);
  const lineas = leer(".env.example").split(/\r?\n/).filter((l: string) => l.trim() && !l.trim().startsWith("#"));
  assert.ok(lineas.length > 0);
  for (const linea of lineas) {
    assert.match(linea, /^[A-Z][A-Z0-9_]*=$/, `la plantilla no debe traer valores: ${linea}`);
  }
});
test("el codigo de la app no usa funciones peligrosas ni variables publicas", () => {
  const peligrosas = /dangerouslySetInnerHTML|\.innerHTML|document\.write|\beval\(|new Function\(|NEXT_PUBLIC_/;
  for (const archivo of archivosDe("src", [".ts", ".tsx"])) {
    assert.doesNotMatch(leer(archivo), peligrosas, archivo);
  }
});
test("los workflows de GitHub Actions no usan secretos y solo tienen permiso de lectura", () => {
  for (const archivo of archivosDe(".github/workflows", [".yml", ".yaml"])) {
    const texto = leer(archivo);
    assert.doesNotMatch(texto, /\$\{\{\s*secrets\./, `${archivo} no deberia necesitar secretos`);
    assert.match(texto, /permissions:\s*\n\s+contents: read/, `${archivo} debe limitar permisos`);
  }
});
test("next.config no anuncia la tecnologia del servidor", () => {
  assert.match(leer("next.config.mjs"), /poweredByHeader:\s*false/);
});

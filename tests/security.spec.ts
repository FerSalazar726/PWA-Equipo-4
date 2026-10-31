import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test, beforeEach, afterEach } from "node:test";
import {
  applySecurityHeaders,
  buildContentSecurityPolicy,
  getSecurityHeaders,
} from "../src/lib/security/headers";
import { containsPII, findPII, redactPII } from "../src/lib/security/privacy";
import { findSecrets, maskSecret, redactSecrets } from "../src/lib/security/secrets";
import {
  isRealDate,
  isSyncOperation,
  isValidInspectionId,
  validateInspectionPayload,
} from "../src/lib/security/validation";
import { enqueueOperation, readQueue } from "../src/lib/sync/queue";
import { STORAGE_KEY } from "../src/lib/storage/schema";
import type { SyncOperation } from "../src/lib/storage/schema";

// Pruebas de seguridad: validacion, privacidad (PII), CSP/cabeceras, secretos
// y endurecimiento de la cola offline. Todo con datos sinteticos.

const payloadValido = {
  location: "Laboratorio de Redes",
  date: "2026-10-01",
  inspector: "Tecnica A",
  status: "attention",
  statusLabel: "Requiere atencion",
  findings: 2,
  summary: "Dos observaciones sinteticas para seguimiento.",
};

function errores(entrada: unknown): string[] {
  const resultado = validateInspectionPayload(entrada);
  return resultado.ok ? [] : resultado.errors;
}

// ---------- Validacion de ids ----------

test("acepta ids con el formato esperado", () => {
  for (const id of ["inspection-001", "inspection-local-1", "a", "x-9"]) {
    assert.equal(isValidInspectionId(id), true, id);
  }
});

test("rechaza ids con recorrido de rutas, inyeccion, mayusculas, espacios o demasiado largos", () => {
  const maliciosos = [
    "../etc/passwd",
    "..%2F..%2Fetc%2Fpasswd",
    "' OR 1=1 --",
    "<script>alert(1)</script>",
    "INSPECTION-001",
    "inspection 001",
    "inspection-001\n",
    "",
    "-inspection",
    "a".repeat(65),
  ];
  for (const id of maliciosos) {
    assert.equal(isValidInspectionId(id), false, JSON.stringify(id));
  }
});

test("rechaza ids que no son texto", () => {
  for (const id of [null, undefined, 1, {}, [], ["inspection-001"]]) {
    assert.equal(isValidInspectionId(id), false);
  }
});

// ---------- Validacion de payloads ----------

test("un payload sintetico correcto es aceptado y normalizado", () => {
  const resultado = validateInspectionPayload({ ...payloadValido, location: "  Laboratorio de Redes  " });
  assert.equal(resultado.ok, true);
  if (resultado.ok) assert.equal(resultado.value.location, "Laboratorio de Redes");
});

test("rechaza entradas que no son objetos", () => {
  for (const entrada of [null, undefined, "texto", 42, [], [payloadValido]]) {
    assert.ok(errores(entrada).length > 0, JSON.stringify(entrada));
  }
});

test("rechaza campos extra no permitidos (mass assignment)", () => {
  const lista = errores({ ...payloadValido, isAdmin: true });
  assert.ok(lista.some((e) => e.includes("isAdmin")));
});

test("rechaza campos de texto con tipo incorrecto, vacios o solo espacios", () => {
  assert.ok(errores({ ...payloadValido, location: 123 }).length > 0);
  assert.ok(errores({ ...payloadValido, inspector: "" }).length > 0);
  assert.ok(errores({ ...payloadValido, summary: "     " }).length > 0);
});

test("rechaza textos demasiado largos", () => {
  assert.ok(errores({ ...payloadValido, summary: "a".repeat(281) }).length > 0);
  assert.ok(errores({ ...payloadValido, location: "a".repeat(81) }).length > 0);
});

test("rechaza marcas HTML y caracteres de control", () => {
  assert.ok(errores({ ...payloadValido, summary: "<img src=x onerror=alert(1)>" }).length > 0);
  assert.ok(errores({ ...payloadValido, summary: "hola\u0000mundo" }).length > 0);
  assert.ok(errores({ ...payloadValido, summary: "linea1\nlinea2" }).length > 0);
});

test("rechaza fechas con mal formato o que no existen", () => {
  for (const date of ["2026-02-30", "2026-13-01", "01/10/2026", "2026-1-1", "", 20261001, null]) {
    assert.ok(errores({ ...payloadValido, date }).length > 0, String(date));
  }
  assert.equal(isRealDate("2028-02-29"), true);
  assert.equal(isRealDate("2027-02-29"), false);
});

test("rechaza estados fuera de la lista y hallazgos invalidos", () => {
  assert.ok(errores({ ...payloadValido, status: "critical" }).length > 0);
  for (const findings of [-1, 1.5, "2", NaN, Infinity, 1000, null]) {
    assert.ok(errores({ ...payloadValido, findings }).length > 0, String(findings));
  }
});

test("el estado debe ser coherente con los hallazgos", () => {
  assert.ok(errores({ ...payloadValido, status: "ok", findings: 2 }).length > 0);
  assert.ok(errores({ ...payloadValido, status: "attention", findings: 0 }).length > 0);
  assert.deepEqual(errores({ ...payloadValido, status: "ok", findings: 0 }), []);
});

// ---------- Privacidad: datos personales ----------

test("detecta correos, telefonos y CURP", () => {
  assert.deepEqual(findPII("escribe a persona@ejemplo.com").map((h) => h.kind), ["email"]);
  assert.deepEqual(findPII("llama al 664 123 4567").map((h) => h.kind), ["telefono"]);
  assert.deepEqual(findPII("llama al 6641234567").map((h) => h.kind), ["telefono"]);
  assert.deepEqual(findPII("llama al +52 664-123-4567").map((h) => h.kind), ["telefono"]);
  assert.deepEqual(findPII("CURP: ABCD123456HBCXYZ09").map((h) => h.kind), ["curp"]);
});

test("no marca como datos personales los textos sinteticos normales", () => {
  const normales = [
    "Revisión visual de cableado, ventilación y estaciones de trabajo.",
    "Se registraron dos observaciones sintéticas para seguimiento de mantenimiento.",
    "Inspección del 2026-10-01 en el laboratorio 12, equipo 3450.",
    "Técnica A",
  ];
  for (const texto of normales) assert.equal(containsPII(texto), false, texto);
});

test("redactPII oculta los datos personales", () => {
  const limpio = redactPII("contacto: persona@ejemplo.com o 664 123 4567");
  assert.equal(limpio, "contacto: [dato personal] o [dato personal]");
});

test("un payload con datos personales es rechazado", () => {
  assert.ok(errores({ ...payloadValido, summary: "Avisar a persona@ejemplo.com" }).length > 0);
  assert.ok(errores({ ...payloadValido, inspector: "Ana 664 123 4567" }).length > 0);
  assert.ok(errores({ ...payloadValido, summary: "CURP ABCD123456HBCXYZ09" }).length > 0);
});

// ---------- CSP y cabeceras ----------

test("la CSP de produccion bloquea lo peligroso y limita todo a 'self'", () => {
  const csp = buildContentSecurityPolicy();
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /form-action 'self'/);
  assert.match(csp, /connect-src 'self'(;|$)/);
  assert.doesNotMatch(csp, /'unsafe-eval'/);
  assert.doesNotMatch(csp, /(^|\s)\*(\s|;|$)/, "no debe haber comodines");
  assert.doesNotMatch(csp, /https?:/, "no debe permitir origenes externos");
});

test("la CSP de desarrollo agrega solo lo que Next necesita para recargar", () => {
  const csp = buildContentSecurityPolicy({ development: true });
  assert.match(csp, /'unsafe-eval'/);
  assert.match(csp, /ws:/);
});

test("las cabeceras incluyen CSP, nosniff, permisos y aislamiento", () => {
  const cabeceras = new Map(getSecurityHeaders().map((h) => [h.key, h.value]));
  assert.ok(cabeceras.get("Content-Security-Policy"));
  assert.equal(cabeceras.get("X-Content-Type-Options"), "nosniff");
  assert.equal(cabeceras.get("X-Frame-Options"), "DENY");
  assert.equal(cabeceras.get("Referrer-Policy"), "same-origin");
  assert.equal(cabeceras.get("Cross-Origin-Opener-Policy"), "same-origin");
  assert.equal(cabeceras.get("Cross-Origin-Resource-Policy"), "same-origin");
});

test("la politica de permisos niega camara, microfono y ubicacion", () => {
  const politica = getSecurityHeaders().find((h) => h.key === "Permissions-Policy")?.value ?? "";
  for (const permiso of ["camera", "microphone", "geolocation"]) {
    assert.match(politica, new RegExp(`${permiso}=\\(\\)`), permiso);
  }
});

test("applySecurityHeaders escribe todas las cabeceras en la respuesta", () => {
  const headers = new Headers();
  applySecurityHeaders(headers);
  for (const { key, value } of getSecurityHeaders()) {
    assert.equal(headers.get(key), value, key);
  }
});

// ---------- Secretos ----------

// Los secretos de prueba se arman por partes para que ESTE archivo no los contenga completos.
const falsos = {
  aws: "AKIA" + "ABCDEFGHIJKLMNOP",
  github: "ghp_" + "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8",
  slack: "xoxb-" + "1234567890-abcdefghij",
  jwt: "eyJ" + "hbGciOiJIUzI1NiJ9" + "." + "eyJzdWIiOiIxMjM0NTY3ODkwIn0" + "." + "dBjftJeZ4CVPmB92K27uhbUJU1p1r",
  pem: "-----BEGIN " + "RSA PRIVATE KEY-----",
  asignacion: 'const api_key = "' + "abcd1234efgh5678" + '";',
  url: "postgres://" + "usuario:contrasena123@" + "servidor.local/base",
};

test("detecta cada tipo de secreto conocido", () => {
  for (const [nombre, valor] of Object.entries(falsos)) {
    assert.ok(findSecrets(valor).length > 0, nombre);
  }
});

test("no marca como secreto el texto normal ni los ejemplos vacios", () => {
  const normales = [
    "const titulo = 'Inspecciones de Laboratorio';",
    "SYNC_SERVER_TOKEN=",
    "El token de sesion se explica en la documentacion.",
    "password: se pide al usuario",
  ];
  for (const texto of normales) assert.deepEqual(findSecrets(texto), [], texto);
});

test("el reporte indica la linea y nunca incluye el secreto completo", () => {
  const hallazgos = findSecrets(`linea uno\nconst x = 1;\n${falsos.github}`);
  assert.equal(hallazgos.length, 1);
  assert.equal(hallazgos[0].line, 3);
  assert.ok(!hallazgos[0].preview.includes(falsos.github));
  assert.equal(maskSecret(falsos.github), "ghp_***");
});

test("redactSecrets elimina los secretos del texto", () => {
  const limpio = redactSecrets(`token ${falsos.github} y llave ${falsos.aws}`);
  assert.ok(!limpio.includes(falsos.github));
  assert.ok(!limpio.includes(falsos.aws));
  assert.match(limpio, /\[secreto oculto\]/);
});

// Revisa los archivos de texto del repositorio: ninguno debe contener secretos.
const raiz = process.cwd();
const EXTENSIONES = new Set([
  ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".md", ".css", ".html",
  ".yml", ".yaml", ".txt", ".webmanifest", ".example",
]);
const CARPETAS_IGNORADAS = new Set(["node_modules", ".next", ".test-build", ".git", "reports", "coverage", "out"]);

function archivosDelRepositorio(): string[] {
  const git = spawnSync("git", ["ls-files"], { cwd: raiz, encoding: "utf8" });
  if (git.status === 0 && git.stdout.trim()) {
    return git.stdout.split("\n").filter(Boolean);
  }
  const lista: string[] = [];
  const recorrer = (carpeta: string) => {
    for (const nombre of readdirSync(path.join(raiz, carpeta))) {
      const relativa = path.join(carpeta, nombre);
      if (CARPETAS_IGNORADAS.has(nombre)) continue;
      if (statSync(path.join(raiz, relativa)).isDirectory()) recorrer(relativa);
      else lista.push(relativa.split(path.sep).join("/"));
    }
  };
  recorrer("");
  return lista;
}

test("ningun archivo del repositorio contiene secretos", () => {
  const revisados: string[] = [];
  const hallazgos: string[] = [];
  for (const archivo of archivosDelRepositorio()) {
    const nombre = path.basename(archivo);
    if (nombre === "package-lock.json") continue;
    if (!EXTENSIONES.has(path.extname(nombre)) && !nombre.startsWith(".env")) continue;
    const ruta = path.join(raiz, archivo);
    if (statSync(ruta).size > 1_000_000) continue;
    revisados.push(archivo);
    for (const h of findSecrets(readFileSync(ruta, "utf8"))) {
      hallazgos.push(`${archivo}:${h.line} (${h.rule}) ${h.preview}`);
    }
  }
  assert.ok(revisados.length > 20, "la revision debe cubrir el repositorio, no una lista vacia");
  assert.deepEqual(hallazgos, []);
});

test("no hay archivos .env con valores reales en el repositorio", () => {
  const envs = archivosDelRepositorio().filter((f) => path.basename(f).startsWith(".env"));
  assert.deepEqual(envs.filter((f) => path.basename(f) !== ".env.example"), []);
});

// ---------- Cola offline endurecida ----------

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

function operacion(operationId: string, parcial: Partial<SyncOperation> = {}): SyncOperation {
  return {
    operationId,
    inspectionId: "inspection-001",
    type: "update",
    payload: payloadValido as SyncOperation["payload"],
    createdAt: "2026-10-01T10:00:00.000Z",
    status: "pending",
    attempts: 0,
    ...parcial,
  };
}

const global_ = globalThis as any;

beforeEach(() => {
  global_.window = { localStorage: crearAlmacenSimulado() };
});

afterEach(() => {
  delete global_.window;
});

test("si localStorage trae JSON valido pero que no es una lista, la cola queda vacia", () => {
  for (const contenido of ['{"a":1}', '"texto"', "42", "null", "true"]) {
    global_.window.localStorage.setItem(STORAGE_KEY, contenido);
    assert.deepEqual(readQueue(), [], contenido);
  }
});

test("encolar no truena aunque localStorage haya sido manipulado con un objeto", () => {
  global_.window.localStorage.setItem(STORAGE_KEY, '{"a":1}');
  assert.equal(enqueueOperation(operacion("op-nueva")), true);
  assert.deepEqual(readQueue().map((op) => op.operationId), ["op-nueva"]);
});

test("las entradas manipuladas se descartan y las validas se conservan", () => {
  const buena = operacion("op-buena");
  const manipuladas = [
    null,
    "texto",
    { operationId: "x" },
    operacion("op-id-malo", { inspectionId: "../../etc/passwd" }),
    operacion("op-estado-malo", { status: "hacked" as never }),
    operacion("op-intentos-malos", { attempts: -5 }),
    operacion("op-extra", { isAdmin: true } as never),
    operacion("op-pii", { payload: { ...payloadValido, summary: "persona@ejemplo.com" } as never }),
    operacion("op-html", { payload: { ...payloadValido, summary: "<script>x</script>" } as never }),
  ];
  global_.window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...manipuladas, buena]));
  assert.deepEqual(readQueue().map((op) => op.operationId), ["op-buena"]);
});

test("no se encola una operacion con datos personales ni con campos extra", () => {
  const conPII = operacion("op-pii", { payload: { ...payloadValido, summary: "llamar al 664 123 4567" } as never });
  assert.equal(enqueueOperation(conPII), false);
  assert.equal(enqueueOperation(operacion("op-extra", { isAdmin: true } as never)), false);
  assert.deepEqual(readQueue(), []);
});

test("una operacion valida se encola y sigue siendo idempotente", () => {
  assert.equal(enqueueOperation(operacion("op-1")), true);
  assert.equal(enqueueOperation(operacion("op-1")), true);
  assert.equal(readQueue().length, 1);
});

test("isSyncOperation acepta ids de inspecciones creadas sin conexion", () => {
  assert.equal(isSyncOperation(operacion("op-local", { inspectionId: "inspection-local-1" })), true);
});
// Validacion por lista permitida (allowlist) de todo lo que entra a la app:
// ids de la URL, payloads de inspeccion y operaciones de la cola offline.
// Usa imports relativos para poder ejecutarse tambien en las pruebas de Node.
import type { InspectionPayload, SyncOperation } from "../storage/schema";
import { findPII } from "./privacy";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

// Solo minusculas, numeros y guiones, maximo 64 caracteres. Bloquea "../",
// espacios, comillas, "<script>" y cualquier otro caracter inesperado.
export const SAFE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

export const LIMITS = {
  location: 80,
  inspector: 60,
  statusLabel: 40,
  summary: 280,
  maxFindings: 999,
  maxAttempts: 1000,
  maxOperationId: 100,
  maxLastError: 300,
} as const;

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const HTML_MARKS = /[<>]/;
const PAYLOAD_KEYS = ["location", "date", "inspector", "status", "statusLabel", "findings", "summary"];
const OPERATION_KEYS = [
  "operationId",
  "inspectionId",
  "type",
  "payload",
  "createdAt",
  "status",
  "attempts",
  "lastError",
];

export function isValidInspectionId(id: unknown): id is string {
  return typeof id === "string" && SAFE_ID_PATTERN.test(id);
}

function isPlainObject(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

export function isRealDate(valor: unknown): valor is string {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

function isIsoTimestamp(valor: unknown): valor is string {
  return typeof valor === "string" && valor.length <= 40 && Number.isFinite(Date.parse(valor));
}

function validarTexto(
  errores: string[],
  campo: string,
  valor: unknown,
  maximo: number,
  buscarPII: boolean
): string {
  if (typeof valor !== "string") {
    errores.push(`${campo} debe ser texto`);
    return "";
  }
  const limpio = valor.trim();
  if (limpio.length === 0) errores.push(`${campo} no puede estar vacio`);
  if (limpio.length > maximo) errores.push(`${campo} excede ${maximo} caracteres`);
  if (CONTROL_CHARS.test(limpio)) errores.push(`${campo} contiene caracteres de control`);
  if (HTML_MARKS.test(limpio)) errores.push(`${campo} no puede contener marcas HTML (< o >)`);
  if (buscarPII && findPII(limpio).length > 0) {
    errores.push(`${campo} parece contener datos personales (correo, telefono o CURP)`);
  }
  return limpio;
}

export function validateInspectionPayload(entrada: unknown): ValidationResult<InspectionPayload> {
  if (!isPlainObject(entrada)) {
    return { ok: false, errors: ["el payload debe ser un objeto"] };
  }
  const errores: string[] = [];

  for (const clave of Object.keys(entrada)) {
    if (!PAYLOAD_KEYS.includes(clave)) errores.push(`campo no permitido: ${clave}`);
  }

  const location = validarTexto(errores, "location", entrada.location, LIMITS.location, true);
  const inspector = validarTexto(errores, "inspector", entrada.inspector, LIMITS.inspector, true);
  const statusLabel = validarTexto(errores, "statusLabel", entrada.statusLabel, LIMITS.statusLabel, true);
  const summary = validarTexto(errores, "summary", entrada.summary, LIMITS.summary, true);

  if (!isRealDate(entrada.date)) errores.push("date debe ser una fecha real con formato AAAA-MM-DD");

  const status = entrada.status;
  if (status !== "ok" && status !== "attention") errores.push('status debe ser "ok" o "attention"');

  const findings = entrada.findings;
  if (!Number.isInteger(findings) || (findings as number) < 0 || (findings as number) > LIMITS.maxFindings) {
    errores.push(`findings debe ser un entero entre 0 y ${LIMITS.maxFindings}`);
  } else if (status === "ok" && findings !== 0) {
    errores.push('un estado "ok" no puede tener hallazgos');
  } else if (status === "attention" && findings === 0) {
    errores.push('un estado "attention" necesita al menos un hallazgo');
  }

  if (errores.length > 0) return { ok: false, errors: errores };

  return {
    ok: true,
    value: {
      location,
      date: entrada.date as string,
      inspector,
      status: status as "ok" | "attention",
      statusLabel,
      findings: findings as number,
      summary,
    },
  };
}

// Valida la forma completa de una operacion de la cola. Se usa al LEER de
// localStorage, que el usuario (o un script malicioso) puede haber modificado.
export function isSyncOperation(entrada: unknown): entrada is SyncOperation {
  if (!isPlainObject(entrada)) return false;
  if (Object.keys(entrada).some((clave) => !OPERATION_KEYS.includes(clave))) return false;

  const { operationId, inspectionId, type, payload, createdAt, status, attempts, lastError } = entrada;
  if (typeof operationId !== "string" || operationId.length === 0 || operationId.length > LIMITS.maxOperationId) {
    return false;
  }
  if (!isValidInspectionId(inspectionId)) return false;
  if (type !== "create" && type !== "update") return false;
  if (!isIsoTimestamp(createdAt)) return false;
  if (status !== "pending" && status !== "synced" && status !== "error") return false;
  if (!Number.isInteger(attempts) || (attempts as number) < 0 || (attempts as number) > LIMITS.maxAttempts) {
    return false;
  }
  if (lastError !== undefined && (typeof lastError !== "string" || lastError.length > LIMITS.maxLastError)) {
    return false;
  }
  return validateInspectionPayload(payload).ok;
}
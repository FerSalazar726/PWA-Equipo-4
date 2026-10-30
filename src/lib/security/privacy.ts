// Deteccion de datos personales (PII) en texto libre.
// La app solo debe manejar datos SINTETICOS: si un texto parece contener un
// correo, un telefono o una CURP, se rechaza antes de guardarlo.

export type PIIKind = "email" | "telefono" | "curp";

export type PIIFinding = { kind: PIIKind; match: string };

const PATRONES: Array<{ kind: PIIKind; regex: RegExp }> = [
  { kind: "email", regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  { kind: "curp", regex: /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/gi },
  {
    kind: "telefono",
    regex: /(?<!\d)(?:\+?52[\s.-]?)?(?:\d{3}[\s.-]?\d{3}[\s.-]?\d{4}|\d{2}[\s.-]?\d{4}[\s.-]?\d{4})(?!\d)/g,
  },
];

export function findPII(texto: string): PIIFinding[] {
  const encontrados: PIIFinding[] = [];
  for (const { kind, regex } of PATRONES) {
    for (const coincidencia of texto.matchAll(regex)) {
      encontrados.push({ kind, match: coincidencia[0] });
    }
  }
  return encontrados;
}

export function containsPII(texto: string): boolean {
  return findPII(texto).length > 0;
}

// Sustituye cada dato personal por una marca, para poder mostrar o registrar el texto.
export function redactPII(texto: string): string {
  let resultado = texto;
  for (const { regex } of PATRONES) {
    resultado = resultado.replace(regex, "[dato personal]");
  }
  return resultado;
}
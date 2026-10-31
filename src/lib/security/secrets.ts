// Deteccion y ocultamiento de secretos (llaves, tokens, contrasenas) en texto.
// La app actual no maneja secretos; esto sirve para que las pruebas revisen
// que nadie los suba al repositorio.

export type SecretFinding = { rule: string; line: number; preview: string };

const REGLAS: Array<{ rule: string; regex: RegExp }> = [
  { rule: "clave privada PEM", regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY(?: BLOCK)?-----/ },
  { rule: "llave de acceso de AWS", regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { rule: "token de GitHub", regex: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { rule: "token de Slack", regex: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { rule: "JWT", regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  {
    rule: "asignacion de secreto",
    regex: /\b(?:password|passwd|secret|api[_-]?key|token)\b\s*[:=]\s*["'][^"'\s]{8,}["']/i,
  },
  { rule: "URL con credenciales", regex: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s@/]+@/i },
];

// Nunca devuelve el secreto completo: solo los primeros 4 caracteres.
export function maskSecret(valor: string): string {
  return `${valor.slice(0, 4)}***`;
}

export function findSecrets(texto: string): SecretFinding[] {
  const encontrados: SecretFinding[] = [];
  texto.split(/\r?\n/).forEach((linea, indice) => {
    for (const { rule, regex } of REGLAS) {
      const coincidencia = linea.match(regex);
      if (coincidencia) {
        encontrados.push({ rule, line: indice + 1, preview: maskSecret(coincidencia[0]) });
      }
    }
  });
  return encontrados;
}

export function redactSecrets(texto: string): string {
  let resultado = texto;
  for (const { regex } of REGLAS) {
    const global = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`);
    resultado = resultado.replace(global, "[secreto oculto]");
  }
  return resultado;
}
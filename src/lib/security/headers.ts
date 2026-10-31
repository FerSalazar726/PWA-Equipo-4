// Cabeceras de seguridad HTTP: CSP, permisos del navegador y otras defensas.
// Una sola fuente de verdad: la usa src/middleware.ts y la revisan las pruebas.

export type SecurityHeader = { key: string; value: string };

export type SecurityHeaderOptions = {
  // En desarrollo Next necesita eval y WebSocket para recargar en caliente.
  development?: boolean;
};

export function buildContentSecurityPolicy(options: SecurityHeaderOptions = {}): string {
  const dev = options.development === true;
  const directivas: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'unsafe-inline' es necesario porque Next inyecta scripts en linea para
    // hidratar la pagina y las paginas estaticas no pueden usar nonces.
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...(dev ? ["ws:", "wss:"] : [])],
    "manifest-src": ["'self'"],
    "worker-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directivas)
    .map(([nombre, valores]) => `${nombre} ${valores.join(" ")}`)
    .join("; ");
}

// Politica de permisos: la app hoy NO usa camara, microfono ni ubicacion en su
// interfaz, asi que se niegan para todos (minimo privilegio). Si algun dia se
// conecta la camara, se cambia aqui a camera=(self) y se documenta.
export const PERMISSIONS_POLICY =
  "camera=(), microphone=(), geolocation=(), payment=(), usb=()";

export function getSecurityHeaders(options: SecurityHeaderOptions = {}): SecurityHeader[] {
  return [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(options) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "same-origin" },
    { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ];
}

export function applySecurityHeaders(headers: Headers, options: SecurityHeaderOptions = {}): void {
  for (const { key, value } of getSecurityHeaders(options)) {
    headers.set(key, value);
  }
}
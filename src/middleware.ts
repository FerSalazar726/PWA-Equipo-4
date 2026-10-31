import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";

// Agrega las cabeceras de seguridad (CSP, permisos, etc.) a todas las
// respuestas de paginas, API, service worker y manifest.
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  applySecurityHeaders(response.headers, {
    development: process.env.NODE_ENV !== "production",
  });
  return response;
}

export const config = {
  // No se procesan los archivos internos de Next (_next/static y _next/image).
  matcher: ["/((?!_next/static|_next/image).*)"],
};
"use client";

import type { ReactNode } from "react";

export function Header() {
  return (
    <header style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0" }}>
      <nav
        aria-label="Navegación principal"
        style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}
      >
        <strong>Inspecciones de Laboratorio</strong>
        <a href="/">Inicio</a>
        <a href="/laboratorios">Laboratorios</a>
      </nav>
    </header>
  );
}

export function LoadingState() {
  return <p role="status">Cargando inspecciones...</p>;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" style={{ color: "#b91c1c" }}>
      <p>Ocurrio un error: {message}</p>
    </div>
  );
}

export function EmptyState() {
  return <p>No hay inspecciones registradas todavia.</p>;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div style={{ padding: "1rem" }}>{children}</div>
    </>
  );
}

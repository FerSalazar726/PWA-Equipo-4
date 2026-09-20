"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function LabMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <path d="M7 7h10v10H7zM23 7h10v10H23zM7 23h10v10H7z" stroke="currentColor" strokeWidth="2" />
      <path d="m23 28 4 4 7-10" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

export function Header({ pathname = "/" }: { pathname?: string }) {
  const laboratoriesActive = pathname === "/laboratorios" || pathname.startsWith("/laboratorios/");
  return (
    <header className="app-header">
      <div className="masthead">
        <div className="brand">
          <span className="brand-mark"><LabMark /></span>
          <div>
            <span className="brand-caption">Bitácora técnica · UTT</span>
            <strong>Inspecciones de Laboratorio</strong>
          </div>
        </div>
        <nav aria-label="Navegación principal" className="main-nav">
          <a href="/" aria-current={pathname === "/" ? "page" : undefined}>
            <span className="nav-index" aria-hidden="true">01</span> Inicio
          </a>
          <a href="/laboratorios" aria-current={laboratoriesActive ? "page" : undefined}>
            <span className="nav-index" aria-hidden="true">02</span> Laboratorios
          </a>
        </nav>
        <span className="demo-label"><span aria-hidden="true" />Datos sintéticos</span>
      </div>
    </header>
  );
}

function StateSymbol({ kind }: { kind: "loading" | "error" | "empty" }) {
  return (
    <svg className={`state-symbol state-symbol-${kind}`} viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
      {kind === "loading" ? (
        <>
          <path d="M15 29V15h14m22 0h14v14M15 51v14h14m22 0h14V51" stroke="currentColor" strokeWidth="2" />
          <path d="M27 30h26M27 40h18M27 50h22" stroke="currentColor" strokeWidth="2" opacity=".4" />
          <path className="scan-line" d="M20 40h40" stroke="currentColor" strokeWidth="3" />
        </>
      ) : kind === "error" ? (
        <>
          <path d="m40 12 29 52H11L40 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M40 31v15m0 8v3" stroke="currentColor" strokeWidth="3" />
        </>
      ) : (
        <>
          <path d="M23 16h24l12 12v36H23V16Z" stroke="currentColor" strokeWidth="2" />
          <path d="M47 16v12h12M32 39h18m-18 9h18m-18 9h9" stroke="currentColor" strokeWidth="2" />
          <circle cx="20" cy="20" r="7" fill="var(--accent)" stroke="currentColor" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

export function LoadingState() {
  return (
    <div className="state-panel state-loading" role="status" aria-live="polite">
      <StateSymbol kind="loading" />
      <div className="state-copy">
        <p className="eyebrow">Consultando la bitácora</p>
        <h2>Cargando inspecciones...</h2>
        <p>Estamos preparando los registros para su consulta.</p>
        <div className="loading-lines" aria-hidden="true"><span /><span /><span /></div>
      </div>
      <span className="state-code" aria-hidden="true">LECTURA / 01</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="state-panel state-error" role="alert">
      <StateSymbol kind="error" />
      <div className="state-copy">
        <p className="eyebrow">La consulta se interrumpió</p>
        <h2>No pudimos cargar las inspecciones.</h2>
        <p className="error-message">Ocurrió un error: {message}</p>
        <p>Puedes volver a intentar la consulta más tarde.</p>
      </div>
      <span className="state-code" aria-hidden="true">AVISO / 02</span>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="state-panel state-empty" role="status">
      <StateSymbol kind="empty" />
      <div className="state-copy">
        <p className="eyebrow">Una bitácora por comenzar</p>
        <h2>No hay inspecciones registradas todavía.</h2>
        <p>Cuando haya registros disponibles, aparecerán en este espacio.</p>
      </div>
      <span className="state-code" aria-hidden="true">REGISTRO / 00</span>
    </div>
  );
}

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div role="status" className="offline-banner">
      Estás sin conexión. Mostrando datos guardados.
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <Header pathname={pathname} />
      <OfflineBanner />
      <div className="shell-content" id="contenido" tabIndex={-1}>{children}</div>
    </>
  );
}

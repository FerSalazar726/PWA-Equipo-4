"use client";

// Pagina de Inspecciones de laboratorio: muestra los estados con datos sintéticos.

import { useEffect, useState } from "react";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/app-shell";

type Inspeccion = {
  id: string;
  laboratorio: string;
  fecha: string;
  responsable: string;
  hallazgos: number;
};

const inspeccionesSinteticas: Inspeccion[] = [
  { id: "1", laboratorio: "Laboratorio de Redes", fecha: "2026-08-28", responsable: "Tecnica A", hallazgos: 0 },
  { id: "2", laboratorio: "Laboratorio de Electronica", fecha: "2026-08-27", responsable: "Tecnico B", hallazgos: 2 },
  { id: "3", laboratorio: "Laboratorio de Software", fecha: "2026-08-26", responsable: "Tecnica C", hallazgos: 0 },
];

// Cambia este valor para probar cada estado a mano: "loading" | "error" | "empty" | "success"
const ESTADO_DE_PRUEBA: "loading" | "error" | "empty" | "success" = "success";

export default function Page() {
  const [estado, setEstado] = useState<"loading" | "error" | "empty" | "success">("loading");
  const [datos, setDatos] = useState<Inspeccion[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (ESTADO_DE_PRUEBA === "error") {
        setEstado("error");
      } else if (ESTADO_DE_PRUEBA === "empty") {
        setDatos([]);
        setEstado("empty");
      } else {
        setDatos(inspeccionesSinteticas);
        setEstado("success");
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  const attentionCount = datos.filter((d) => d.hallazgos > 0).length;
  const okCount = datos.filter((d) => d.hallazgos === 0).length;

  return (
    <div className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">Gestión de espacios / Equipo 04</p>
        <span className="edition-label">Bitácora de mantenimiento</span>
      </div>
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="tiny-cross" aria-hidden="true">+</span> Observar. Registrar. Dar seguimiento.</p>
          <h1>Inspecciones de laboratorio</h1>
          <p className="lead">Cada revisión cuenta. Consulta el estado de los espacios y las observaciones que necesitan seguimiento.</p>
          <a className="primary-link" href="#inspections-heading">Explorar inspecciones <span aria-hidden="true">↗</span></a>
          <p className="hero-note">Datos sintéticos para aprender, probar y mejorar.</p>
        </div>
        <aside className="register-summary" aria-label="Resumen de inspecciones sintéticas">
          <div className="register-top"><span className="eyebrow">Corte de demostración</span><span aria-hidden="true">↗</span></div>
          <div className="register-total"><span>{String(datos.length).padStart(2, "0")}</span><p>inspecciones<br />registradas</p></div>
          <dl className="register-counts">
            <div><dt><span aria-hidden="true">✓</span> Sin incidencias</dt><dd>{String(okCount).padStart(2, "0")}</dd></div>
            <div><dt><span aria-hidden="true">!</span> Requieren atención</dt><dd>{String(attentionCount).padStart(2, "0")}</dd></div>
          </dl>
          <div className="register-bottom"><span>Registro de práctica</span><span aria-hidden="true">IL — 04</span></div>
        </aside>
        <span className="hero-ruler" aria-hidden="true" />
      </header>
      <section aria-labelledby="inspections-heading" className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / Registro de actividad</p>
            <h2 id="inspections-heading" tabIndex={-1}>Inspecciones recientes<span aria-hidden="true">.</span></h2>
          </div>
          <span className="count">{datos.length} registros de demostración</span>
        </div>

        {estado === "loading" && <LoadingState />}
        {estado === "error" && (
          <ErrorState message="No se pudo cargar la informacion." />
        )}
        {estado === "empty" && <EmptyState />}
        {estado === "success" && (
          <div className="inspection-grid">
            {datos.map((inspeccion, index) => {
              const isOk = inspeccion.hallazgos === 0;
              return (
                <article className={`inspection-card inspection-card-${isOk ? "ok" : "attention"}`} key={inspeccion.id}>
                  <div className="card-topline">
                    <span className="record-index">Registro / {String(index + 1).padStart(2, "0")}</span>
                    <time className="muted" dateTime={inspeccion.fecha}>{inspeccion.fecha}</time>
                  </div>
                  <div className={`badge badge-${isOk ? "ok" : "attention"}`}>
                    <span className="badge-symbol" aria-hidden="true">{isOk ? "✓" : "!"}</span>
                    {isOk ? "Sin incidencias" : "Requiere atención"}
                  </div>
                  <h3>{inspeccion.laboratorio}</h3>
                  <dl className="inspection-details">
                    <div><dt>Responsable</dt><dd>{inspeccion.responsable}</dd></div>
                    <div><dt>Hallazgos</dt><dd><span className={`finding-count finding-count-${isOk ? "ok" : "attention"}`}>{String(inspeccion.hallazgos).padStart(2, "0")}</span></dd></div>
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <footer className="footer">
        <div><strong>El cuidado está en los detalles.</strong><p>Universidad Tecnológica de Tehuacán · Equipo 04</p></div>
        <span className="footer-tag">Proyecto de Aplicaciones Web Progresivas <span aria-hidden="true">↗</span></span>
      </footer>
    </div>
  );
}
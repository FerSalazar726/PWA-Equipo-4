import { inspections } from "../lib/data/inspections";

export default function HomePage() {
  const attentionCount = inspections.filter((inspection) => inspection.status === "attention").length;
  const okCount = inspections.filter((inspection) => inspection.status === "ok").length;

  return (
    <main className="page-shell">
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
          <div className="register-total"><span>{String(inspections.length).padStart(2, "0")}</span><p>inspecciones<br />registradas</p></div>
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
          <span className="count">{inspections.length} registros de demostración</span>
        </div>
        <div className="inspection-grid">
          {inspections.map((inspection, index) => (
            <article className={`inspection-card inspection-card-${inspection.status}`} key={inspection.id}>
              <div className="card-topline">
                <span className="record-index">Registro / {String(index + 1).padStart(2, "0")}</span>
                <time className="muted" dateTime={inspection.date}>{inspection.date}</time>
              </div>
              <div className={`badge badge-${inspection.status}`}>
                <span className="badge-symbol" aria-hidden="true">{inspection.status === "ok" ? "✓" : "!"}</span>
                {inspection.statusLabel}
              </div>
              <h3>{inspection.location}</h3>
              <p className="inspection-summary">{inspection.summary}</p>
              <dl className="inspection-details">
                <div><dt>Responsable</dt><dd>{inspection.inspector}</dd></div>
                <div><dt>Hallazgos</dt><dd><span className={`finding-count finding-count-${inspection.status}`}>{String(inspection.findings).padStart(2, "0")}</span></dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>
      <footer className="footer">
        <div><strong>El cuidado está en los detalles.</strong><p>Universidad Tecnológica de Tehuacán · Equipo 04</p></div>
        <span className="footer-tag">Proyecto de Aplicaciones Web Progresivas <span aria-hidden="true">↗</span></span>
      </footer>
    </main>
  );
}

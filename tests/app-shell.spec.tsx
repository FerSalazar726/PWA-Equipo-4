import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell, Header, LoadingState, ErrorState, EmptyState } from "../src/components/app-shell";
import HomePage from "../src/app/page";

test("Header ofrece Inicio y Laboratorios en una navegación identificable", () => {
  const html = renderToStaticMarkup(<Header />);
  assert.match(html, /<nav[^>]*aria-label="Navegación principal"/);
  assert.match(html, /<strong>Inspecciones de Laboratorio<\/strong>/);
  assert.match(html, /<a href="\/"[^>]*>[\s\S]*?Inicio<\/a>/);
  assert.match(html, /<a href="\/laboratorios"[^>]*>[\s\S]*?Laboratorios<\/a>/);
});

test("AppShell conserva el contenido y coloca un único encabezado antes de él", () => {
  const html = renderToStaticMarkup(
    <AppShell><main><h1>Inspección sintética</h1><p>Contenido de la página</p></main></AppShell>
  );
  assert.equal((html.match(/<header\b/g) ?? []).length, 1);
  assert.match(html, /<main><h1>Inspección sintética<\/h1><p>Contenido de la página<\/p><\/main>/);
  assert.ok(html.indexOf("</header>") < html.indexOf("<main>"));
});

test("AppShell acepta una página sin contenido sin perder la navegación", () => {
  const html = renderToStaticMarkup(<AppShell>{null}</AppShell>);
  assert.match(html, /<a href="\/"[^>]*>[\s\S]*?Inicio<\/a>/);
});

test("LoadingState comunica la carga mediante role=status", () => {
  const html = renderToStaticMarkup(<LoadingState />);
  assert.match(html, /role="status"/);
  assert.match(html, /Cargando inspecciones\.\.\./);
  assert.match(html, /aria-live="polite"/);
});

test("ErrorState anuncia el mensaje específico mediante role=alert", () => {
  const html = renderToStaticMarkup(<ErrorState message="Fallo sintético de conexión" />);
  assert.match(html, /<div[^>]*role="alert"/);
  assert.match(html, /Ocurrió un error: Fallo sintético de conexión/);
});

test("ErrorState muestra texto y no ejecuta HTML recibido en message", () => {
  const html = renderToStaticMarkup(<ErrorState message={'<script>alert("demo")</script>'} />);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(&quot;demo&quot;\)&lt;\/script&gt;/);
});

test("EmptyState explica que no hay registros y no muestra una alerta de error", () => {
  const html = renderToStaticMarkup(<EmptyState />);
  assert.match(html, /No hay inspecciones registradas todavía\./);
  assert.doesNotMatch(html, /role="alert"/);
});

test("Header identifica solamente el enlace de la sección actual", () => {
  const html = renderToStaticMarkup(<Header pathname="/laboratorios/redes" />);
  assert.match(html, /href="\/laboratorios" aria-current="page"/);
  assert.doesNotMatch(html, /href="\/" aria-current/);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
});

test("Header no marca una ruta parecida como sección Laboratorios", () => {
  const html = renderToStaticMarkup(<Header pathname="/laboratorios-archivo" />);
  assert.doesNotMatch(html, /aria-current/);
});

test("AppShell permite saltar a un destino enfocable antes del contenido", () => {
  const html = renderToStaticMarkup(<AppShell><main>Contenido</main></AppShell>);
  assert.match(html, /href="#contenido">Saltar al contenido<\/a>/);
  assert.match(html, /id="contenido" tabindex="-1"/);
  assert.ok(html.indexOf("Saltar al contenido") < html.indexOf("<header"));
});

test("La portada conserva los registros sintéticos y ofrece un enlace interno válido", () => {
  const html = renderToStaticMarkup(<HomePage />);
  assert.equal((html.match(/<article\b/g) ?? []).length, 3);
  assert.equal((html.match(/<main\b/g) ?? []).length, 1);
  for (const location of ["Redes", "Electrónica", "Software"]) {
    assert.ok(html.includes(`Laboratorio de ${location}`));
  }
  assert.match(html, /href="#inspections-heading"/);
  assert.match(html, /id="inspections-heading" tabindex="-1"/);
});

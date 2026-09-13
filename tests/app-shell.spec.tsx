import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell, Header, LoadingState, ErrorState, EmptyState } from "../src/components/app-shell";

test("Header ofrece Inicio y Laboratorios en una navegación identificable", () => {
  const html = renderToStaticMarkup(<Header />);
  assert.match(html, /<nav[^>]*aria-label="Navegación principal"/);
  assert.match(html, /<strong>Inspecciones de Laboratorio<\/strong>/);
  assert.match(html, /<a href="\/">Inicio<\/a>/);
  assert.match(html, /<a href="\/laboratorios">Laboratorios<\/a>/);
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
  assert.match(html, /<a href="\/">Inicio<\/a>/);
});

test("LoadingState comunica la carga mediante role=status", () => {
  const html = renderToStaticMarkup(<LoadingState />);
  assert.match(html, /<p role="status">Cargando inspecciones\.\.\.<\/p>/);
});

test("ErrorState anuncia el mensaje específico mediante role=alert", () => {
  const html = renderToStaticMarkup(<ErrorState message="Fallo sintético de conexión" />);
  assert.match(html, /<div[^>]*role="alert"/);
  assert.match(html, /Ocurrio un error: Fallo sintético de conexión/);
});

test("ErrorState muestra texto y no ejecuta HTML recibido en message", () => {
  const html = renderToStaticMarkup(<ErrorState message={'<script>alert("demo")</script>'} />);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(&quot;demo&quot;\)&lt;\/script&gt;/);
});

test("EmptyState explica que no hay registros y no muestra una alerta de error", () => {
  const html = renderToStaticMarkup(<EmptyState />);
  assert.match(html, /No hay inspecciones registradas todavia\./);
  assert.doesNotMatch(html, /role="alert"/);
});

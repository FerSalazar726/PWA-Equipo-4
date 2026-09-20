import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { registerServiceWorker } from "../src/lib/pwa/register-service-worker";
import { OfflineBanner } from "../src/components/app-shell";

test("registerServiceWorker no lanza error cuando no hay navegador (SSR/Node)", () => {
  assert.doesNotThrow(() => {
    registerServiceWorker();
  });
});

test("OfflineBanner no muestra nada en el render inicial del servidor", () => {
  const html = renderToStaticMarkup(<OfflineBanner />);
  assert.equal(html, "");
});
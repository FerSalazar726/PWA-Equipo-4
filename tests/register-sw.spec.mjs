import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../.test-build/src/lib/pwa/register-service-worker.js", import.meta.url), "utf8");

function setup(readyState, supported = true) {
  const calls = [];
  const listeners = [];
  const context = {
    exports: {},
    console: { log() {}, error() {} },
    document: { readyState },
    window: { addEventListener: (...args) => listeners.push(args) },
    navigator: supported ? { serviceWorker: { register: (url) => {
      calls.push(url);
      return Promise.resolve({ scope: "/" });
    } } } : {},
  };
  runInNewContext(source, context);
  return { context, calls, listeners, register: context.exports.registerServiceWorker };
}

test("Registra el worker aunque load haya ocurrido antes de montar React", () => {
  const { register, calls, listeners } = setup("complete");
  register();
  assert.deepEqual(calls, ["/sw.js"]);
  assert.equal(listeners.length, 0);
});

test("Espera load una sola vez si el documento todavía está cargando", () => {
  const { register, calls, listeners } = setup("loading");
  register();
  assert.equal(calls.length, 0);
  assert.equal(listeners.length, 1);
  const [event, callback, options] = listeners[0];
  assert.equal(event, "load");
  assert.equal(options.once, true);
  callback();
  assert.deepEqual(calls, ["/sw.js"]);
});

test("No intenta registrar un worker si el navegador no lo soporta", () => {
  const { register, calls, listeners } = setup("complete", false);
  register();
  assert.equal(calls.length, 0);
  assert.equal(listeners.length, 0);
});

test("No accede al navegador durante ejecución en el servidor", () => {
  const { register, context, calls } = setup("complete");
  delete context.window;
  delete context.document;
  delete context.navigator;
  assert.doesNotThrow(register);
  assert.equal(calls.length, 0);
});

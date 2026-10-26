import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";

const swPath = path.join(process.cwd(), "public", "sw.js");
const swSource = fs.readFileSync(swPath, "utf-8");

test("el service worker define un nombre de cache", () => {
  assert.match(swSource, /CACHE_NAME\s*=\s*["'`][\w-]+["'`]/);
});

test("el service worker escucha install, activate y fetch", () => {
  assert.match(swSource, /addEventListener\(\s*["']install["']/);
  assert.match(swSource, /addEventListener\(\s*["']activate["']/);
  assert.match(swSource, /addEventListener\(\s*["']fetch["']/);
});

test("el service worker precachea la pagina offline", () => {
  assert.match(swSource, /offline\.html/);
});

test("el service worker limpia caches antiguos en activate", () => {
  assert.match(swSource, /caches\.delete/);
});

test("el service worker solo intercepta peticiones GET", () => {
  assert.match(swSource, /request\.method\s*!==\s*["']GET["']/);
});
import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";

const manifestPath = path.join(
  process.cwd(),
  "public",
  "manifest.webmanifest"
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

test("tiene display standalone", () => {
  assert.equal(manifest.display, "standalone");
});

test("tiene un scope definido", () => {
  assert.notEqual(manifest.scope, undefined);
});

test("tiene al menos un icono valido", () => {
  assert.ok(Array.isArray(manifest.icons));
  assert.ok(manifest.icons.length > 0);
  assert.ok(Object.prototype.hasOwnProperty.call(manifest.icons[0], "src"));
  assert.ok(Object.prototype.hasOwnProperty.call(manifest.icons[0], "sizes"));
});
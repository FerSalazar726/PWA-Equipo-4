import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
const tokens = Object.fromEntries([...css.matchAll(/--([a-z-]+):\s*(#[\da-f]{6});/gi)].map((match) => [match[1], match[2]]));

function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

// Actual foreground/background tokens used by the UI. Require 4.5:1 even for headings.
for (const [foreground, background] of [
  ["ink", "background"], ["muted", "background"],
  ["ink", "surface"], ["muted", "surface"],
  ["on-dark", "ink"], ["muted-dark", "ink"],
  ["ink", "accent"], ["ink", "accent-soft"],
  ["success", "success-soft"], ["warning", "warning-soft"],
  ["error", "error-soft"], ["muted", "error-soft"],
  ["warning", "surface"], ["focus", "surface"]
]) {
  test(`Contraste de ${foreground} sobre ${background} >= 4.5:1`, () => {
    assert.ok(tokens[foreground] && tokens[background], "Los colores deben existir en el CSS real");
    const values = [luminance(tokens[foreground]), luminance(tokens[background])].sort((a, b) => b - a);
    const ratio = (values[0] + 0.05) / (values[1] + 0.05);
    assert.ok(ratio >= 4.5, `${tokens[foreground]} / ${tokens[background]}: ${ratio.toFixed(2)}:1`);
  });
}

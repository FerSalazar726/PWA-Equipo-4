import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const { LoadingState, ErrorState, EmptyState } = require("../.test-build/src/components/app-shell.js");
const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
const states = [
  createElement(LoadingState),
  createElement(ErrorState, { message: "Fallo sintético de conexión." }),
  createElement(EmptyState)
].map((element) => renderToStaticMarkup(element)).join("\n");
const output = new URL("../.test-build/states.html", import.meta.url);

await writeFile(output, `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Estados de la bitácora</title><style>${css}</style></head>
<body><main class="page-shell"><h1 style="font-size:2.6rem;text-align:center">Estados de la bitácora</h1>${states}</main></body></html>`, "utf8");
console.log(`Vista local de los componentes reales: ${fileURLToPath(output)}`);

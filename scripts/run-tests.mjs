import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

// Ejecuta con el test runner de Node todos los archivos *.spec.js|mjs|cjs
// que haya dentro de las carpetas indicadas (busca tambien en subcarpetas)
// o los archivos de prueba que se indiquen directamente.
// Si una carpeta no existe o no tiene pruebas, falla: asi no hay "verdes vacios".
const root = resolve(import.meta.dirname, "..");
const carpetas = process.argv.slice(2);

if (carpetas.length === 0) {
  console.error("Uso: node scripts/run-tests.mjs <carpeta> [<carpeta> ...]");
  process.exit(2);
}

function buscarPruebas(carpeta) {
  const encontradas = [];
  for (const nombre of readdirSync(carpeta)) {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) {
      encontradas.push(...buscarPruebas(ruta));
    } else if (/\.spec\.(js|mjs|cjs)$/.test(nombre)) {
      encontradas.push(ruta);
    }
  }
  return encontradas;
}

const archivos = [];
for (const carpeta of carpetas) {
  const absoluta = resolve(root, carpeta);
  if (!existsSync(absoluta)) {
    console.error(`No existe la carpeta: ${carpeta}`);
    process.exit(1);
  }
  // Acepta carpetas (busca pruebas dentro) o un archivo de prueba puntual.
  if (statSync(absoluta).isFile()) archivos.push(absoluta);
  else archivos.push(...buscarPruebas(absoluta));
}

if (archivos.length === 0) {
  console.error(`No se encontraron pruebas (*.spec.js, *.spec.mjs) en: ${carpetas.join(", ")}`);
  process.exit(1);
}

console.log(`Ejecutando ${archivos.length} archivo(s) de prueba...`);
const resultado = spawnSync(process.execPath, ["--test", ...archivos], { cwd: root, stdio: "inherit" });
process.exit(resultado.status ?? 1);
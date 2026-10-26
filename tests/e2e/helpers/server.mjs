import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";

// Levanta el servidor de produccion (`next start`) en un puerto libre para que
// las pruebas E2E hablen con la aplicacion real por HTTP. Requiere `npm run build`.
const raiz = resolve(import.meta.dirname, "../../..");

function puertoLibre() {
  return new Promise((resolver, rechazar) => {
    const servidor = createServer();
    servidor.unref();
    servidor.on("error", rechazar);
    servidor.listen(0, "127.0.0.1", () => {
      const { port } = servidor.address();
      servidor.close(() => resolver(port));
    });
  });
}

async function esperarServidor(baseUrl, hijo, salida) {
  const limite = Date.now() + 60_000;
  while (Date.now() < limite) {
    if (hijo.exitCode !== null) {
      throw new Error(`next start termino antes de tiempo:\n${salida()}`);
    }
    try {
      const respuesta = await fetch(baseUrl);
      if (respuesta.status < 500) return;
    } catch {
      // Todavia no esta listo: se vuelve a intentar.
    }
    await new Promise((listo) => setTimeout(listo, 250));
  }
  throw new Error(`El servidor no respondio en 60 segundos:\n${salida()}`);
}

export async function iniciarServidor() {
  if (!existsSync(resolve(raiz, ".next", "BUILD_ID"))) {
    throw new Error("No hay build de produccion. Corre primero: npm run build");
  }
  const puerto = await puertoLibre();
  const baseUrl = `http://127.0.0.1:${puerto}`;
  const hijo = spawn(
    process.execPath,
    [resolve(raiz, "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(puerto), "-H", "127.0.0.1"],
    {
      cwd: raiz,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  let texto = "";
  hijo.stdout.on("data", (trozo) => { texto += trozo; });
  hijo.stderr.on("data", (trozo) => { texto += trozo; });
  try {
    await esperarServidor(baseUrl, hijo, () => texto);
  } catch (error) {
    hijo.kill();
    throw error;
  }
  return {
    baseUrl,
    async detener() {
      if (hijo.exitCode !== null) return;
      const termino = new Promise((listo) => hijo.once("exit", listo));
      hijo.kill();
      await termino;
    },
  };
}

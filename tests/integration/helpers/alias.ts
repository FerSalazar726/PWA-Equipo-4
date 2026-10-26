import Module from "node:module";
import path from "node:path";
// Las pruebas corren sobre el JavaScript ya compilado en .test-build/, donde
// el alias "@/..." de TypeScript no existe. Este ayudante lo traduce a la
// carpeta compilada para poder importar el codigo real de la app (rutas API,
// paginas) sin modificarlo. Debe importarse ANTES que cualquier modulo de src/.
type ResolverArchivo = (peticion: string, ...resto: unknown[]) => string;
const modulo = Module as unknown as { _resolveFilename: ResolverArchivo };
const resolverOriginal = modulo._resolveFilename;
const carpetaCompilada = path.join(process.cwd(), ".test-build", "src");
modulo._resolveFilename = function (this: unknown, peticion: string, ...resto: unknown[]) {
  const destino = peticion.startsWith("@/")
    ? path.join(carpetaCompilada, peticion.slice(2))
    : peticion;
  return resolverOriginal.call(this, destino, ...resto);
};

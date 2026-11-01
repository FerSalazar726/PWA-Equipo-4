# Estrategia de pruebas

Proyecto: PWA de inspecciones de laboratorio (datos sintéticos). Este documento explica qué probamos, en qué nivel, por qué y qué dejamos sin probar.

## Flujo crítico que protegemos

1. La persona abre la app y ve el listado de inspecciones.
2. Entra al detalle de una inspección.
3. La app pide ese detalle a la API y lo muestra.
4. Si no hay conexión, los cambios se guardan en una cola local y se sincronizan al volver (sin duplicarse y resolviendo conflictos).
5. La app se puede instalar y tiene página de respaldo sin conexión.

Si algo de esto se rompe, el producto deja de cumplir su objetivo. Por eso cada nivel de la pirámide cubre una parte de este flujo.

## La pirámide

- **Unitarias** — carpeta `tests/unit/` — 88 pruebas — `npm run test:unit`. Revisan una función o componente aislado, con `navigator` y `localStorage` simulados.
- **Integración** — carpeta `tests/integration/` — 31 pruebas — `npm run test:integration`. Juntan varias piezas reales: ruta API + datos, página SSR + datos, cola + esquema + política de conflictos, y manifest + iconos + service worker.
- **Seguridad** — archivo `tests/security.spec.ts` — 33 pruebas — `npm run test:security`. Revisan los controles de la Semana 9: validación de entradas, detección de datos personales y secretos, cabeceras y CSP, y la cola offline endurecida. Además, `tests/integration/seguridad.spec.ts` y `tests/e2e/seguridad.spec.mjs` las comprueban en conjunto y por HTTP.
- **E2E** — carpeta `tests/e2e/` — 20 pruebas — `npm run build` y después `npm run test:e2e`. Prueban la app compilada (`next start`) a través de HTTP: listado -> detalle -> API, y los archivos de la PWA.

(Cantidades al cierre de la Semana 9; la salida de `npm run test:unit`, `npm run test:integration`, `npm run test:security` y `npm run test:e2e` es la fuente de verdad.)

La forma de pirámide es intencional: muchas pruebas rápidas y baratas abajo, pocas y más lentas arriba. Las unitarias tardan menos de un segundo; las E2E necesitan el build y un servidor, así que son pocas y solo cubren el recorrido completo.

## Qué cubre cada nivel

**Unitarias.** Cola de sincronización (sin duplicados, reintentos, límite de 3 intentos, JSON dañado, localStorage lleno, ejecución en servidor), política de conflictos (gana el más reciente, empate favorece al local, fechas inválidas lanzan `RangeError`), datos sintéticos (ids únicos, fechas válidas, estado coherente con los hallazgos), cámara, ubicación y notificaciones (permiso concedido, negado, API ausente, timeout), service worker, manifest, componentes del shell y contraste de colores.

**Integración.** Se importa el código real de la app y se prueba en conjunto: el manejador de `/api/inspecciones/[id]` con la capa de datos, la página del listado renderizada con sus datos, el recorrido completo de la cola contra un servidor falso que se desconecta y reconecta, y la coherencia entre manifest, iconos, service worker y página offline.

**Seguridad (Semana 9).** Se prueba que la validación rechace ids con `../`, inyección o HTML, campos extra, fechas imposibles y datos personales; que la CSP y las cabeceras estén completas y sin comodines; que la política de permisos niegue cámara, micrófono y ubicación; que ningún archivo del repositorio contenga secretos; y que la cola offline descarte entradas manipuladas en `localStorage`. En integración se comprueba el middleware real, la ruta API con ids maliciosos y los archivos de configuración (`.gitignore`, `.env.example`, `robots.txt`, workflows). En E2E se comprueban las cabeceras reales, `robots.txt`, los 404 uniformes, que no se sirvan archivos privados y que la API solo acepte GET.

**E2E.** Se levanta el servidor de producción y se hacen peticiones HTTP reales: el listado trae las 3 inspecciones en el HTML, cada enlace abre su detalle y su API devuelve la misma inspección, un id inexistente responde 404 en la API, y los archivos de la PWA (manifest, iconos, `sw.js`, `offline.html`) se sirven con el tipo correcto.

## Decisiones y trade-offs

- **`node:test` sin dependencias nuevas.** Ya lo usaba el proyecto. Evita cambiar `package-lock.json` y mantiene `npm ci` rápido. A cambio no hay reportes de cobertura ni herramientas de simulación (mocks) avanzadas.
- **E2E por HTTP y no con un navegador.** Es estable, rápido y no necesita descargar navegadores en CI. Comprueba lo que el servidor entrega, pero no ejecuta el JavaScript del navegador: no ve el detalle ya cargado (solo el estado de carga inicial), ni hace clic, ni instala la PWA. Un navegador real (por ejemplo Playwright) sería el siguiente paso.
- **Simulación de APIs del navegador.** `navigator`, `window.localStorage` y `Notification` se reemplazan por objetos falsos. Las pruebas son deterministas y corren en Node, pero no detectan diferencias reales entre navegadores.
- **Ayudante de alias en integración.** Las pruebas corren sobre JavaScript compilado, donde el alias `@/` de TypeScript no existe. `tests/integration/helpers/alias.ts` lo traduce para poder importar el código real sin modificar `src/`.
- **Un solo comando de verificación.** `npm run verify` sigue siendo la entrada única (estructura, pruebas, build); la E2E va aparte porque necesita el build ya hecho.

## Automatización (CI)

`.github/workflows/academic-evaluation.yml` corre en cada push y pull request, con Node.js 20.19.6: `npm ci`, pruebas unitarias, pruebas de integración, pruebas de seguridad, `npm run verify` (estructura, pruebas y build) y pruebas E2E sobre ese build. Guarda `reports/verification.json` como evidencia. El workflow `week-01-starter-feedback.yml` se conserva y corre en paralelo.

## Fallos y límites encontrados

- En la Semana 4 el listado `/inspecciones` quedó estático aunque el código decía que era dinámico, y las pruebas que leen el código como texto no lo detectaron; lo encontró la tabla del build. Ahora una prueba E2E comprueba que la respuesta no se cachea como página estática.
- El detalle de un id inexistente responde HTTP 200, porque el 404 se resuelve en el navegador (CSR). Está documentado en una prueba E2E; arreglarlo implicaría cambiar la arquitectura del detalle.
- Algunas pruebas anteriores (`rendering`, `service-worker`, `manifest`) leen archivos como texto; son frágiles ante cambios de formato. Las pruebas de integración y E2E las complementan con comportamiento real.
- En la Semana 9 una prueba de seguridad encontró que la cola offline fallaba si `localStorage` tenía JSON válido que no era una lista. Se corrigió en `src/lib/sync/queue.ts` y quedó cubierto por pruebas.
- La cámara y la geolocalización siguen sin estar conectadas a una pantalla de la app; sus pruebas cubren únicamente la lógica de permisos.

## Qué no se prueba

- Comportamiento en un navegador real: diálogos de permiso, cámara y GPS verdaderos, instalación de la PWA, funcionamiento sin conexión con el service worker activo.
- Que la CSP no bloquee nada en un navegador real: las pruebas revisan las cabeceras por HTTP, pero la revisión de la consola del navegador es manual.
- Accesibilidad más allá de las pruebas de contraste y roles de los componentes.
- Cobertura de código (no se mide).
- Carga o rendimiento.
- Sincronización con un backend real: no existe; la cola se prueba contra un servidor falso.
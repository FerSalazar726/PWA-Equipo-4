# PWA de inspecciones de laboratorio — proyecto del equipo

Este es un proyecto acumulativo: un repositorio privado por equipo durante el curso. `START_HERE.md` y `ACTIVIDAD-01.md` conservan las instrucciones de la Semana 1. La Semana 2 (app shell instalable y manifest) ya está integrada y verificada en `main`: manifest e íconos (Fernanda), app-shell con header/navegación/estados y rediseño visual (Oscar), y page.tsx con los 4 estados más las pruebas del manifest (Jarumi).

## Entorno

Node.js 20.19 o posterior compatible, npm 10 o posterior, Git y cuenta de GitHub. No se requiere Make. Registren aquí las versiones usadas (`node --version`, `npm --version`) y cualquier dificultad de entorno que encuentren.

## Ejecución

```bash
npm ci
npm run dev
```

Abran `http://localhost:3000` y comprueben las tres inspecciones sintéticas. Detengan el servidor con Ctrl+C.

## Verificación

```bash
npm run verify
```

Ejecuta comprobación de archivos, prueba proporcionada y build; genera `reports/verification.json`. El reporte contiene resultados técnicos y documentos para revisión, no una calificación automática. `make verify` es equivalente. `bash public-tests/check.sh` es un check opcional de estructura.

GitHub Actions ejecuta la misma verificación y permite descargar el artefacto `starter-week-01-evidence`. El reporte local se excluye de Git: adjúntenlo en Classroom o descarguen el del SHA entregado desde Actions.

## Trabajo y entrega en equipo

Inviten a los integrantes y al docente al mismo repositorio privado. Cada persona registra su evidencia en una sección de `evidence/individual.md`. Todos entregan en Classroom el mismo SHA final y enlaces, identificando su sección. El formato exacto está en `ACTIVIDAD-01.md`; no se requiere un pull request adicional ni una copia por alumno.

## Estructura y límites

- `src/app/`: pantalla Next.js.
- `src/lib/data/`: inspecciones sintéticas.
- `docs/`: requisitos y decisión del equipo.
- `evidence/`: evidencia propia de cada integrante.
- `tests/`: prueba inicial proporcionada y pruebas de renderizado de los componentes de Oscar; no es una suite completa de la PWA.

El proyecto cuenta con manifest e iconos integrados desde main; la instalación todavía no se ha certificado y no implementa offline ni sincronización. No incluyan datos personales reales en el producto, archivos `.env` ni credenciales. La identificación de integrantes se conserva en el repositorio privado y Classroom.

## Semana 2: aporte de Oscar

Alcance de `Semana2_Oscar.pdf`: `src/components/app-shell.tsx` exporta `AppShell`, `Header`, `LoadingState`, `ErrorState` y `EmptyState`. Se conserva la interfaz de la guía: `AppShell` recibe `children` y `ErrorState` recibe `message: string`. El encabezado contiene Inicio (`/`) y Laboratorios (`/laboratorios`). La navegación tiene un nombre accesible y permite ajustar sus enlaces en varias líneas.

La copia inicial de `layout.tsx` todavía no importaba el shell; se agregó únicamente la importación y la envoltura del contenido para poder verificarlo. Tras incorporar main, se renovó la presentación de la portada y se corrigió el main anidado del layout, conservando los datos sintéticos. Jarumi puede importar los estados desde `@/components/app-shell` para integrarlos en `page.tsx`; los componentes solo presentan el estado que seleccione la página, no realizan solicitudes ni manejan reintentos.

### Instalación y verificación reproducible

Entorno local comprobado el 13 de septiembre de 2026: Windows, Node.js `v22.22.0`, npm `10.9.4`.

```bash
npm ci
make verify
```

Si no se dispone de Make, el equivalente exacto es `npm ci` seguido de `npm run verify`: la receta `verify` del Makefile ejecuta ese script. Para ejecutar solo las pruebas, usar `npm test`. No se añadieron dependencias ni se modificó el lockfile.

`npm test` ejecuta la prueba del starter, compila los componentes y sus pruebas con `tests/tsconfig.json` y ejecuta 11 casos de componentes/portada con `node:test` y `react-dom/server`, más 14 combinaciones de contraste calculadas a partir de los colores reales de `globals.css`. Se comprueban enlaces, encabezado antes del contenido, contenido vacío, mensajes de carga/error/vacío, roles accesibles de carga/error y escape de HTML del mensaje de error. `.test-build/` contiene los archivos temporales y está excluido de Git. `make verify` también compila Next.js y genera `reports/verification.json`.

Resultado local: instalación correcta, prueba inicial PASS, 25 pruebas aprobadas y build correcto. El workflow existente `Starter Semana 1 — feedback` también ejecuta estas pruebas al hacer push, mediante `npm run verify`; conserva su nombre histórico. En CI usa Node.js `20.19.6` y `npm ci --ignore-scripts --no-audit --no-fund`. El artefacto `starter-week-01-evidence` contiene el reporte del SHA probado. El enlace de ejecución y el SHA del aporte se registran en [la evidencia individual](evidence/individual.md#semana-2-oscar).

### Comprobación visual

Con el build terminado, ejecutar:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Abrir `http://127.0.0.1:3000`, comprobar que la navegación aparece antes del contenido y que siguen visibles las tres inspecciones sintéticas. Usar Tab para enfocar primero «Saltar al contenido»; Enter debe llevar el foco al contenido. Comprobar también los enlaces Inicio, Laboratorios y «Explorar inspecciones». Revisar anchos de 1280, 390 y 320 píxeles. Detener el servidor con Ctrl+C antes de volver a compilar para evitar compartir `.next` entre desarrollo y build.

Codex realizó una comprobación adicional con Playwright y Edge en esos tamaños: inicio HTTP 200, enlaces accesibles con teclado, encabezado antes del contenido, tres tarjetas y sin errores de JavaScript ni desbordamiento horizontal en las vistas móviles. Esa revisión de navegador es complementaria; `npm test` ejecuta las pruebas de renderizado descritas arriba. Capturas: [escritorio](evidence/oscar-semana2-desktop.png) y [móvil](evidence/oscar-semana2-mobile.png).

### Decisiones, supuestos y límites

- Los estados son componentes reutilizables de presentación. Su separación evita repetir mensajes y roles; decidir cuándo mostrarlos corresponde a la página consumidora. Se conserva `"use client"`: el shell utiliza `usePathname` para señalar la sección activa con `aria-current`; los estados mantienen su interfaz de presentación. Esto incorpora el shell al límite cliente.
- `/laboratorios` es el destino indicado en la guía, pero el repositorio aún no contiene esa ruta: devuelve HTTP 404. Su pantalla queda pendiente de integración por el equipo.
- El manifest y los iconos de Fernanda, `tests/manifest.spec.ts` de Jarumi y el uso de los 4 estados en `page.tsx` ya están integrados y verificados en `main` (ver sección de cierre al final de este README). Sigue pendiente para semanas futuras: instalación real como PWA en un dispositivo, offline y sincronización.
- `npm ci` y `npm audit --json` reportaron dos vulnerabilidades de las dependencias existentes: una crítica en Next.js y una alta en PostCSS. La corrección propuesta por npm implica cambiar de versión mayor de Next.js; requiere una actualización coordinada del proyecto. Las pruebas aprobadas no equivalen a una auditoría de seguridad.
- Uso de IA: Codex (OpenAI) asistió en implementación, pruebas, comprobación de navegador y redacción. La evidencia distingue los resultados automatizados de la validación humana pendiente de Oscar.


## Rediseño de la bitácora técnica

Se integró `main` con `git pull --no-rebase origin main` (base `694638c`) antes del rediseño. El shell y la portada comparten ahora papel marfil, verde profundo, acentos lima y cobre, títulos serif, numeración técnica y estados con SVG. Se conservaron los datos sintéticos, las exportaciones de los componentes y los iconos existentes; no se añadieron dependencias.

Las animaciones de entrada son breves, los indicadores de carga terminan tras tres ciclos y `prefers-reduced-motion` desactiva el movimiento. La navegación cuenta con foco visible, enlace activo y acceso para saltar al contenido. La comprobación adicional de navegador abarcó anchos de 320 a 1440 píxeles, texto al 200%, enlaces internos, hover y movimiento reducido.

Para revisar los estados sin modificar la página, ejecutar `npm run preview:states` y abrir `.test-build/states.html`. Los pasos completos, la paleta con relaciones de contraste, decisiones y límites están en [docs/design.md](docs/design.md). Capturas actuales: [escritorio](evidence/oscar-redesign-desktop.png), [móvil](evidence/oscar-redesign-mobile.png) y [estados](evidence/oscar-redesign-states.png). Las capturas anteriores se conservan como evidencia histórica.


## Cierre de la Semana 2: integración final del equipo

Fernanda integró en `main` las tres partes del equipo: su propio manifest/layout, el `app-shell.tsx` y rediseño visual de Oscar (en dos mezclas, ya que Oscar subió commits adicionales después de la primera), y el `page.tsx`/`tests/manifest.spec.ts` de Jarumi. Se resolvieron conflictos de Git en `evidence/individual.md`, `package.json` y `src/app/page.tsx`, conservando el diseño visual de Oscar pero conectado a los datos sintéticos reales (`Inspeccion`: laboratorio, fecha, responsable, hallazgos) en vez de a datos que no existían en el proyecto.

Durante la integración se corrigieron tres fallos:
- El alias `@/` no se resolvía al ejecutar las pruebas ya compiladas con Node (aunque TypeScript sí lo entendía); se resolvió usando una ruta relativa (`../components/app-shell`) en `page.tsx`.
- El layout y la página tenían dos etiquetas `<main>` anidadas; se dejó un único `<main>` en `page.tsx` (el `layout.tsx` ya no agrega uno propio).
- Faltaba el acento en "Electrónica" en los datos sintéticos, lo que hacía fallar una prueba de la portada.

Resultado final: `npm test` con **28/28 pruebas pasando** (10 de `app-shell.spec.tsx`, 3 de `manifest.spec.ts`, 14 de contraste, 1 de la portada) y `npm run verify` en verde.

- SHA final: `45e1910a0a855ee718eb989dce4b81a04453ef60`
- Ejecución de GitHub Actions: https://github.com/FerSalazar726/PWA-Equipo-4/actions/runs/34806786966

## Semana 3: aviso de conexión y documentación de Oscar

La rama `oscar-semana-3` incorpora `OfflineBanner`, sus estilos, la [estrategia de caché y pasos de prueba](docs/cache-strategy.md) y la [evidencia de Oscar](evidence/individual.md#semana-3-oscar). También corrige el registro del service worker cuando React monta después del evento `load`, con cuatro pruebas de regresión. Esta sección actualiza el estado de las notas históricas de Semana 2: el worker y su respaldo offline ya están integrados; la sincronización sigue pendiente.

Verificación local del 20 de septiembre de 2026: `npm run verify` pasó con 32 pruebas y build de producción correcto. En Edge se comprobaron desconexión/reconexión, recarga offline de la portada, respaldo para una ruta no visitada y anchos de 1280, 390 y 320 píxeles. Las capturas y limitaciones se describen en la evidencia individual.

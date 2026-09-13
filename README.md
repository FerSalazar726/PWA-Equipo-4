# PWA de inspecciones de laboratorio — proyecto del equipo

Este es un proyecto acumulativo: un repositorio privado por equipo durante el curso. `START_HERE.md` y `ACTIVIDAD-01.md` conservan las instrucciones de la Semana 1. El aporte de Oscar para la Semana 2 se documenta abajo; la integración completa de esa semana sigue pendiente del equipo.

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

Registren aquí sus supuestos y limitaciones de ejecución. El starter todavía no implementa instalación PWA, offline ni sincronización. No incluyan datos personales reales en el producto, archivos `.env` ni credenciales. La identificación de integrantes se conserva en el repositorio privado y Classroom.

## Semana 2: aporte de Oscar

Alcance de `Semana2_Oscar.pdf`: `src/components/app-shell.tsx` exporta `AppShell`, `Header`, `LoadingState`, `ErrorState` y `EmptyState`. Se conserva la interfaz de la guía: `AppShell` recibe `children` y `ErrorState` recibe `message: string`. El encabezado contiene Inicio (`/`) y Laboratorios (`/laboratorios`). La navegación tiene un nombre accesible y permite ajustar sus enlaces en varias líneas.

La copia inicial de `layout.tsx` todavía no importaba el shell; se agregó únicamente la importación y la envoltura del contenido para poder verificarlo. Se conserva la pantalla y los datos sintéticos de la Semana 1. Jarumi puede importar los estados desde `@/components/app-shell` para integrarlos en `page.tsx`; los componentes solo presentan el estado que seleccione la página, no realizan solicitudes ni manejan reintentos.

### Instalación y verificación reproducible

Entorno local comprobado el 13 de septiembre de 2026: Windows, Node.js `v22.22.0`, npm `10.9.4`.

```bash
npm ci
make verify
```

Si no se dispone de Make, el equivalente exacto es `npm ci` seguido de `npm run verify`: la receta `verify` del Makefile ejecuta ese script. Para ejecutar solo las pruebas, usar `npm test`. No se añadieron dependencias ni se modificó el lockfile.

`npm test` ejecuta la prueba del starter, compila los componentes y sus pruebas con `tests/tsconfig.json` y ejecuta siete casos con `node:test` y `react-dom/server`. Se comprueban enlaces, encabezado antes del contenido, contenido vacío, mensajes de carga/error/vacío, roles accesibles de carga/error y escape de HTML del mensaje de error. `.test-build/` contiene los archivos temporales y está excluido de Git. `make verify` también compila Next.js y genera `reports/verification.json`.

Resultado local: instalación correcta, prueba inicial PASS, siete pruebas nuevas aprobadas y build correcto. El workflow existente `Starter Semana 1 — feedback` también ejecuta estas pruebas al hacer push, mediante `npm run verify`; conserva su nombre histórico. En CI usa Node.js `20.19.6` y `npm ci --ignore-scripts --no-audit --no-fund`. El artefacto `starter-week-01-evidence` contiene el reporte del SHA probado. El enlace de ejecución y el SHA del aporte se registran en [la evidencia individual](evidence/individual.md#semana-2-oscar).

### Comprobación visual

Con el build terminado, ejecutar:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Abrir `http://127.0.0.1:3000`, comprobar que la navegación aparece antes del contenido y que siguen visibles las tres inspecciones sintéticas. Usar Tab para enfocar Inicio y Laboratorios y comprobar que Inicio regresa a `/`. Revisar anchos de 1280, 390 y 320 píxeles. Detener el servidor con Ctrl+C antes de volver a compilar para evitar compartir `.next` entre desarrollo y build.

Codex realizó una comprobación adicional con Playwright y Edge en esos tamaños: inicio HTTP 200, enlaces accesibles con teclado, encabezado antes del contenido, tres tarjetas y sin errores de JavaScript ni desbordamiento horizontal en las vistas móviles. Esa revisión de navegador es complementaria; `npm test` ejecuta las pruebas de renderizado descritas arriba. Capturas: [escritorio](evidence/oscar-semana2-desktop.png) y [móvil](evidence/oscar-semana2-mobile.png).

### Decisiones, supuestos y límites

- Los estados son componentes reutilizables de presentación. Su separación evita repetir mensajes y roles; decidir cuándo mostrarlos corresponde a la página consumidora. Se conservó `"use client"` para respetar el contrato de la guía, aunque estos componentes no necesitan hooks. Esto permite su uso futuro con estados interactivos, a costa de incluirlos en el límite cliente.
- `/laboratorios` es el destino indicado en la guía, pero el repositorio aún no contiene esa ruta: devuelve HTTP 404. Su pantalla queda pendiente de integración por el equipo.
- `public/manifest.webmanifest`, `tests/manifest.spec.ts`, la configuración de instalación y el uso de los estados en `page.tsx` siguen pendientes del equipo. Esta rama acredita el aporte de Oscar; no acredita la entrega completa de la Semana 2 ni instalación, offline o sincronización.
- `npm ci` y `npm audit --json` reportaron dos vulnerabilidades de las dependencias existentes: una crítica en Next.js y una alta en PostCSS. La corrección propuesta por npm implica cambiar de versión mayor de Next.js; requiere una actualización coordinada del proyecto. Las pruebas aprobadas no equivalen a una auditoría de seguridad.
- Uso de IA: Codex (OpenAI) asistió en implementación, pruebas, comprobación de navegador y redacción. La evidencia distingue los resultados automatizados de la validación humana pendiente de Oscar.

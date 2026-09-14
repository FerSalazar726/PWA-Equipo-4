# Bitácora técnica: diseño del shell

El rediseño de Oscar parte de `git pull --no-rebase origin main`, que integró `694638c` sin conflictos. Mantiene el manifest, los iconos y los datos sintéticos del equipo. La petición posterior del usuario amplió el alcance visual a la portada, el shell y sus estados.

## Identidad visual

Una bitácora de mantenimiento inspira el papel marfil, la tinta verde, el resumen con forma de hoja, las líneas de registro, los índices monoespaciados y los títulos serif. Los estados usan ilustraciones SVG decorativas y mensajes explícitos. El cobre identifica observaciones y errores; cada aviso también incluye texto y símbolo. No se incorporaron fuentes remotas, bibliotecas visuales ni dependencias adicionales.

Las tarjetas conservan las tres inspecciones de demostración. El resumen se calcula a partir de esos datos: tres registros, dos sin incidencias y uno que requiere atención. El enlace «Explorar inspecciones» lleva al registro existente. Los colores del manifest y del navegador coinciden con los del shell.

## Paleta y contraste

| Uso | Texto | Fondo | Relación medida |
| --- | --- | --- | --- |
| Texto principal sobre papel | `#173d35` | `#f5f2e9` | 10.69:1 |
| Texto secundario sobre papel | `#59685e` | `#f5f2e9` | 5.26:1 |
| Título sobre tinta | `#fffdf4` | `#173d35` | 11.74:1 |
| Texto secundario sobre tinta | `#c4d2c1` | `#173d35` | 7.60:1 |
| Acción principal | `#173d35` | `#d8ed85` | 9.33:1 |
| Sin incidencias | `#295943` | `#e8efdc` | 6.84:1 |
| Atención | `#873b20` | `#fbe6d4` | 6.49:1 |
| Error | `#953326` | `#fbe9e3` | 6.43:1 |

`tests/design.spec.mjs` lee los tokens del CSS y calcula 14 combinaciones mediante luminancia relativa sRGB, exigiendo al menos 4.5:1 sin redondear antes de comparar. La referencia es [WCAG 2.2, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Estos controles no constituyen una auditoría completa de conformidad.

La comprobación complementaria en Edge inspeccionó los colores calculados de 54 elementos de texto en la portada y 11 en la muestra de estados: mínimos de 5.26:1 y 5.01:1, respectivamente, sin fallos en las muestras.

## Movimiento e interacción

- Entradas de 350–650 ms y aparición escalonada de tarjetas.
- Subrayado de navegación, elevación sutil de tarjetas y movimiento de la flecha de la acción principal. Las tarjetas siguen siendo contenido, no botones.
- Carga con barrido SVG y líneas animadas: tres ciclos, con el último terminado en aproximadamente 4.1 segundos. Después permanece el mensaje estático mientras el consumidor mantenga el estado de carga.
- `prefers-reduced-motion: reduce` desactiva animaciones, transiciones, desplazamiento suave e inclinaciones decorativas. Se verificó que el navegador no mantuviera animaciones activas. Referencia: [W3C, animación por interacción](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).
- Acceso «Saltar al contenido», destino enfocable, foco visible con dos colores, enlace activo con `aria-current="page"`, símbolos ocultos a tecnologías de asistencia y un único `main` en la portada.

## Repetir la revisión

1. Ejecutar `npm ci` y `make verify` (equivalente: `npm run verify`). Son 25 pruebas, además del check inicial del starter y el build.
2. Ejecutar `npm run dev -- --hostname 127.0.0.1 --port 3000` y abrir la dirección local. Usar Tab y Enter para saltar al contenido y activar «Explorar inspecciones».
3. Revisar la página en anchos de 1440, 1280, 1024, 768, 640, 390 y 320 píxeles. Ampliar el texto al 200% en escritorio. En DevTools puede simularse con `document.documentElement.style.fontSize = '200%'`; restablecerlo con `''`. La hoja de resumen permite saltos de línea para evitar recortes.
4. En las herramientas de renderizado del navegador, emular `prefers-reduced-motion: reduce`; recargar y verificar la ausencia de movimiento. Con la preferencia normal, observar el hover y la entrada de tarjetas.
5. Para ver los tres estados reales sin modificar `page.tsx`, ejecutar `npm run preview:states` y abrir el archivo local `.test-build/states.html` generado. La muestra utiliza los componentes compilados y la hoja de estilos actual, con un error sintético. Conservar la muestra fuera de Git y de la aplicación publicada.

Capturas comprobadas: [escritorio](../evidence/oscar-redesign-desktop.png), [móvil](../evidence/oscar-redesign-mobile.png) y [estados](../evidence/oscar-redesign-states.png). La revisión de navegador es complementaria y no se ejecuta en GitHub Actions; las pruebas de componentes y contraste sí.

## Límites

`/laboratorios` continúa sin una página implementada; se conserva el destino de la guía y no se presenta como una ruta terminada. La integración de los estados con carga de datos sigue a cargo de la página consumidora. No se añadieron reintentos, backend, persistencia ni offline. Las fuentes del sistema pueden variar ligeramente entre Windows, Linux y otros dispositivos. Los iconos PNG de Fernanda se conservan. Las dos vulnerabilidades heredadas de Next.js/PostCSS permanecen documentadas en el README. La revisión humana y la prueba con lectores de pantalla reales siguen pendientes.

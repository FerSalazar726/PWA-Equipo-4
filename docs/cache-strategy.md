# Estrategia de caché - Inspecciones de laboratorio

Esta documentación describe la implementación de Fernanda en `public/sw.js`.

El registro en `src/lib/pwa/register-service-worker.ts` se ejecuta inmediatamente si el documento ya terminó de cargar; de lo contrario espera `load` una sola vez. Esto permite que el componente cliente se monte después de `load` sin perder el registro.

## Qué se cachea

- Durante la instalación se guardan `/`, `/manifest.webmanifest`, `/offline.html`, `/icons/icon-192.png` y `/icons/icon-512.png` (precache).
- Las demás peticiones GET interceptadas se guardan conforme se solicitan si la respuesta tiene estado HTTP 200, incluidos los recursos de la aplicación. Todo se almacena en `inspecciones-lab-v1`.
- No todas las respuestas exitosas se guardan: el código comprueba específicamente el estado 200. Las respuestas opacas de otros orígenes no cumplen esa condición.

## Estrategia: stale-while-revalidate

Para las peticiones GET, el service worker devuelve primero la respuesta guardada, si existe, e inicia una solicitud a la red para actualizar la caché para una visita posterior. Si no hay una respuesta guardada, espera la red. Cuando la red falla y la petición es de navegación, devuelve `offline.html`.

Esta estrategia combina una respuesta inmediata con actualizaciones posteriores. Es adecuada para inspecciones de laboratorio con conectividad intermitente: permite consultar contenido guardado sin esperar la red y renovarlo cuando vuelve la conexión. Cache-first puro puede conservar información antigua sin actualizarla; network-first espera primero a la red.

## Qué no cubre esta versión

- Las peticiones que no son GET pasan directamente a la red; no se almacenan ni se encolan formularios.
- No existe sincronización en segundo plano (Background Sync) para reintentar envíos.
- No hay límite de tamaño ni expiración por tiempo. El navegador también puede desalojar la caché por su propia política de almacenamiento.
- La primera visita requiere conexión para instalar el service worker y guardar los recursos. Un recurso no visitado ni precacheado puede no estar disponible sin conexión.
- El respaldo `offline.html` solo corresponde a navegaciones cuando falla la red; no reemplaza respuestas HTTP de error ni recursos como imágenes o scripts sin caché.
- La actualización asíncrona del caché no está vinculada a `event.waitUntil` en el manejador `fetch` actual; puede interrumpirse si el navegador termina el worker. No se garantiza que cada consulta renueve la caché.
- El aviso `OfflineBanner` usa `navigator.onLine`: indica la conectividad que reporta el navegador, no verifica que el servidor responda ni que exista una copia completa en caché.

## Actualización y versión de la caché

`CACHE_NAME` incluye una versión: `inspecciones-lab-v1`. Cuando cambien los recursos o sea necesario invalidar contenido anterior, se debe incrementar el nombre en `public/sw.js` a `inspecciones-lab-v2`, `inspecciones-lab-v3`, etc., y desplegar el archivo actualizado junto con la aplicación.

Al instalarse el worker nuevo se precargan sus recursos. `skipWaiting()` solicita su activación sin esperar al cierre de las pestañas; durante `activate` se borran las cachés cuyo nombre sea distinto al actual y `clients.claim()` solicita controlar los clientes abiertos. La limpieza actual afecta a cualquier otra caché del mismo origen, no solo a las de esta aplicación. La activación no recarga automáticamente la página ya abierta.

## Cómo comprobar el aviso y el modo sin conexión

1. Ejecutar `npm ci` y `npm run dev`, abrir la página y esperar a que cargue.
2. En DevTools > Network, activar Offline. Debe aparecer «Estás sin conexión. Mostrando datos guardados.» debajo del encabezado y antes del contenido.
3. Desactivar Offline. El aviso debe desaparecer sin recargar. Repetir para comprobar cambios sucesivos.
4. Para verificar la caché de la PWA, detener desarrollo y ejecutar `npm run build` seguido de `npm run start`. Usar un perfil limpio o eliminar el service worker y las cachés locales anteriores antes de probar.
5. Visitar la portada conectado, esperar a que el service worker esté activo y comprobar sus recursos en Application > Cache Storage. Activar Offline y recargar la portada; después abrir una ruta no visitada para comprobar `offline.html`.

El servidor de desarrollo puede generar solicitudes de recarga en caliente que fallan al activar Offline; para evaluar la PWA y sus recursos se usa la compilación de producción.

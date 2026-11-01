# Modelo de amenazas
Proyecto: PWA de inspecciones de laboratorio. Todos los datos son sintéticos. Este documento dice qué queremos
proteger, quién podría atacarlo, qué controles pusimos, cómo lo comprobamos y qué riesgos quedan abiertos.
## 1. Alcance y supuestos
- La app no tiene cuentas ni inicio de sesión. Cualquiera que abra la URL ve las mismas inspecciones.
- No hay base de datos ni backend real: la API (`/api/inspecciones/[id]`) lee un arreglo en memoria y solo responde GET.
- La PWA guarda dos cosas en el navegador: una cola de operaciones offline en `localStorage` y respuestas en la caché
  del service worker (`inspecciones-lab-v1`).
- La cámara y la geolocalización tienen módulos (`src/lib/device/`), pero **no están conectadas a ninguna pantalla**.
  Solo el botón de notificaciones está en la interfaz.
- Supuesto: el hosting final entrega la app por HTTPS. Eso no lo controla este repositorio.
## 2. Activos
- **A1. Registros de inspección** (sintéticos): su integridad y que no se mezclen con datos reales.
- **A2. Cola offline** en `localStorage` (`inspecciones-lab:sync-queue:v1`): lo que el navegador va a enviar al volver la red.
- **A3. Caché del service worker**: páginas y respuestas de la API guardadas en el dispositivo.
- **A4. Permisos del navegador**: notificaciones (en uso), cámara y ubicación (no conectadas).
- **A5. Repositorio y CI**: que no se suban secretos y que el pipeline tenga el mínimo de permisos.
## 3. Fronteras de confianza y actores
```
 Usuario / navegador  --HTTP-->  Servidor Next (middleware -> páginas / API)
   |  localStorage (A2)               |  datos en memoria (A1)
   |  caché del service worker (A3)   |
 Repositorio (GitHub)  --push-->  GitHub Actions (CI)  <--npm ci--  dependencias npm
```
- **El navegador no es confiable**: el usuario o un script malicioso puede editar `localStorage` o enviar peticiones a mano.
- **Actores considerados**: usuario curioso o malicioso, script inyectado (XSS), sitio externo (clickjacking),
  compañero que sube un secreto por error, dependencia npm vulnerable.
## 4. Amenazas, controles y evidencia (método STRIDE)
Resumen (estado: M = mitigada, P = mitigada parcialmente, A = abierta o aceptada):
- T1 Manipulación de la cola offline (Tampering): M
- T2 Id malicioso en la API (Tampering / Info. disclosure): M
- T3 Script inyectado (XSS) (Tampering / Elevation): P
- T4 Clickjacking (Spoofing de interfaz): M
- T5 Sniffing de tipo MIME (Tampering): M
- T6 Datos personales en el sistema (Info. disclosure): P
- T7 Secretos en el repositorio (Info. disclosure): M
- T8 Pistas sobre la tecnología del servidor (Info. disclosure): M
- T9 Permisos del navegador excesivos (Elevation of privilege): M
- T10 Caché del service worker con datos viejos o compartidos (Tampering / Info. disclosure): P
- T11 Dependencias vulnerables (cadena de suministro): A
- T12 Entradas enormes o cola que crece sin control (Denial of service): P
- T13 Falta de autenticación y de bitácora (Repudiation / Spoofing): A
- T14 Peticiones desde otro sitio (CSRF): M
### T1. Manipulación de la cola offline
- Amenaza: alguien edita `localStorage` y deja JSON válido pero de otra forma (un objeto, ids con `../`, estados
  inventados, campos extra, datos personales).
- Control: `readQueue` solo acepta una lista y descarta cada entrada que no pase `isSyncOperation`
  (`src/lib/security/validation.ts`). `enqueueOperation` rechaza operaciones inválidas y regresa `false`.
- Evidencia: `tests/security.spec.ts` ("las entradas manipuladas se descartan...") y
  `tests/integration/seguridad.spec.ts` ("syncQueue nunca envía al servidor una operación manipulada").
- Límite: si el atacante ejecuta código en la página (XSS), puede escribir una operación que SÍ sea válida.
### T2. Id malicioso en la API
- Amenaza: `/api/inspecciones/<id>` con `../../etc/passwd`, `' OR 1=1 --`, HTML o textos larguísimos.
- Control: `isValidInspectionId` (solo minúsculas, números y guiones, máximo 64) se evalúa antes de tocar los datos.
  Un id inválido recibe **la misma respuesta 404** que uno inexistente, sin reflejar la entrada.
- Evidencia: pruebas de ids en `tests/security.spec.ts`, integración y e2e ("ids con inyección... mismo 404").
- Nota: el id solo se usa para buscar en un arreglo; no se concatena a rutas de archivos ni a consultas.
### T3. Script inyectado (XSS)
- Amenaza: texto con HTML o scripts que termine pintado en la página.
- Controles (varias capas): React escapa el texto por defecto; la validación rechaza `<` y `>` y caracteres de control;
  la CSP limita de dónde se cargan scripts; una prueba revisa que `src/` no use `dangerouslySetInnerHTML`, `innerHTML`,
  `document.write`, `eval(` ni `new Function(`.

- Evidencia: `tests/security.spec.ts`, `tests/integration/seguridad.spec.ts`, `tests/e2e/seguridad.spec.mjs`.
- **Riesgo residual**: la CSP lleva `script-src 'unsafe-inline'`. Ver decisión D1.
### T4. Clickjacking
- Amenaza: otro sitio mete nuestra app en un `iframe` para engañar al usuario.
- Control: `frame-ancestors 'none'` en la CSP y `X-Frame-Options: DENY`.
- Evidencia: pruebas de cabeceras (unitarias, integración y e2e).
### T5. Sniffing de tipo MIME
- Amenaza: el navegador interpreta un archivo como otro tipo y ejecuta código.
- Control: `X-Content-Type-Options: nosniff` en todas las respuestas, incluido `sw.js` y el manifest.
- Evidencia: e2e "las páginas, la API y el service worker llevan las cabeceras de seguridad".
### T6. Datos personales en el sistema
- Amenaza: que alguien capture correos, teléfonos o CURP reales en el resumen o en el nombre del inspector.
- Control: `findPII` (`src/lib/security/privacy.ts`) se usa dentro de `validateInspectionPayload`: un payload con
  esos datos se rechaza. El inventario completo está en `docs/privacy-data-inventory.md`.
- Evidencia: pruebas de PII en `tests/security.spec.ts`.
- Límite: la detección usa patrones (regex). No detecta nombres propios ni direcciones. Por eso el control principal
  sigue siendo la regla de usar solo datos sintéticos.
### T7. Secretos en el repositorio
- Amenaza: tokens, llaves o contraseñas subidos por error.
- Controles: `.gitignore` ignora `.env*` (y permite `.env.example`, que solo tiene nombres de variables sin valor);
  los workflows no usan `secrets.` y tienen `permissions: contents: read`; `findSecrets` busca patrones comunes.
- Evidencia: "ningún archivo del repositorio contiene secretos" (revisa los archivos de texto del repo en cada corrida
  de CI), "no hay archivos .env..." y las pruebas de configuración de `tests/integration/seguridad.spec.ts`.
- Límite: solo detecta formatos conocidos. Un secreto con formato raro puede pasar. Si se filtra uno real, hay que
  revocarlo; borrarlo del último commit no basta.
### T8. Pistas sobre la tecnología del servidor
- Amenaza: la cabecera `X-Powered-By: Next.js` le dice a un atacante qué buscar.
- Control: `poweredByHeader: false` en `next.config.mjs`.
- Evidencia: e2e "el servidor no anuncia su tecnología" y la prueba de configuración.
### T9. Permisos del navegador excesivos
- Amenaza: pedir o permitir cámara, micrófono o ubicación sin necesidad.
- Controles: `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()` (mínimo privilegio:
  la interfaz hoy no los usa). Las notificaciones solo se piden cuando la persona presiona el botón.
- Evidencia: pruebas de la política en las tres capas.
- Nota: si algún día se conecta la cámara, hay que cambiar la política a `camera=(self)` y actualizar este documento.
### T10. Caché del service worker
- Amenaza: respuestas guardadas en el dispositivo que otra persona podría ver en una computadora compartida, o datos
  viejos servidos como si fueran nuevos.
- Controles: el service worker solo intercepta GET, limpia cachés viejos al activarse y la CSP restringe las
  conexiones a `'self'`.
- **Riesgo residual**: no hay forma de borrar la caché al "cerrar sesión" porque no hay sesión. Los datos son
  sintéticos, por eso el riesgo se acepta por ahora.
### T11. Dependencias vulnerables
- Amenaza: una librería con una falla conocida.
- Controles: `npm ci --ignore-scripts` en CI, `package-lock.json` versionado, y GitHub Actions con permisos de lectura.
- **Estado abierto**: `npm audit` reporta 3 vulnerabilidades (2 altas y 1 crítica).
  Auditoria ejecutada el 2026-11-01 con `npm audit --json` (salida 1 por vulnerabilidades).
  - `next@14.2.35`: gravedad **critical**; dependencia directa.
  - `postcss@8.4.31`: gravedad **high**; dependencia transitiva.
  - `source-map-js@1.2.1`: gravedad **high**; dependencia transitiva.
  Next agrupa avisos de ejecucion remota, denegacion de servicio, SSRF, XSS y cache; PostCSS reporta
  XSS y lectura de archivos mediante source maps; source-map-js reporta denegacion de servicio del event loop.
  El reporte propone Next 16.4.3 (cambio mayor) y una correccion disponible para source-map-js.
  Son hallazgos del arbol de dependencias, no una demostracion de explotacion en esta app.
  No se aplicó `npm audit fix --force` porque puede subir versiones mayores de Next y romper la app a pocos días
  de la entrega.
  Pendiente: revisar cada aviso y actualizar con pruebas.
### T12. Entradas enormes o cola sin control
- Amenaza: textos gigantes o muchísimas operaciones llenan `localStorage` o bloquean la app.
- Controles: límites de longitud por campo, máximo de 3 intentos por operación y manejo del error cuando
  `localStorage` está lleno (ya existía).
- Límite: no hay un tope al número de operaciones en la cola ni limitación de peticiones (rate limiting), porque no
  existe un backend real.
### T13. Falta de autenticación y de bitácora
- Amenaza: no se puede saber quién hizo un cambio ni impedir que alguien lo haga.
- Estado: **abierto y fuera de alcance**. Con datos sintéticos y sin cuentas no se justifica en esta semana. Si la app
  se usara con datos reales, sería lo primero que habría que agregar.
### T14. Peticiones desde otro sitio (CSRF)
- Amenaza: otro sitio hace que el navegador de la persona dispare acciones en nuestra API.
- Control: la API solo tiene GET sin efectos secundarios (los demás métodos responden 405), no hay cookies de sesión
  y no se envían cabeceras CORS abiertas.
- Evidencia: e2e "la API solo acepta GET" y "no abre CORS a otros sitios".

## 5. Decisiones y trade-offs
- **D1. CSP con `'unsafe-inline'` en scripts.** Next inyecta scripts en línea para hidratar la página. Una CSP estricta
  con nonces obliga a que TODAS las páginas sean dinámicas (el nonce cambia en cada petición), y eso choca con la
  página de inicio estática y con las páginas que el service worker guarda en caché. Elegimos una CSP útil pero
  menos estricta y lo anotamos como riesgo residual. Lo siguiente sería migrar a nonces.
- **D2. Un solo lugar para las cabeceras.** Las definimos en `src/lib/security/headers.ts` y las aplica
  `src/middleware.ts`. Así las pruebas revisan exactamente lo que se envía. El costo es que el middleware corre en
  cada petición.
- **D3. Id inválido responde 404, no 400.** Un 400 le diría al atacante cuál es el formato válido. También evita
  cambiar las pruebas y el comportamiento que ya existían.
- **D4. Validación estricta con lista permitida.** Rechazamos `<` y `>` en los textos y los campos extra. Es más
  seguro, pero un resumen legítimo con esos símbolos no se aceptaría.
- **D5. Validar al leer `localStorage`, no solo al escribir.** Lo guardado en el navegador no es confiable.
- **D6. Permisos negados por defecto.** Es lo más seguro hoy, pero obliga a cambiar la política cuando se conecte la
  cámara o la ubicación.
## 6. Fallos encontrados
- **F1 (código).** Si `localStorage` tenía JSON válido que no era una lista (por ejemplo `{"a":1}`), `enqueueOperation`
  fallaba con `TypeError: queue.some is not a function` y `getPendingOperations` con `filter is not a function`. Lo
  reprodujimos con el código de la Semana 8. Se corrigió validando la forma al leer y se agregaron pruebas.
- **F2 (configuración).** El servidor enviaba `X-Powered-By: Next.js`. Se desactivó.
- **F3 (configuración).** La app no enviaba ninguna cabecera de seguridad (CSP, nosniff, permisos). Se agregaron.
- **F4 (dependencias).** `npm audit` reporta vulnerabilidades. Sigue abierto (ver T11).
## 7. Límites de este trabajo
- Las cabeceras se comprueban por HTTP, no con un navegador. Hay que revisar a mano la consola del navegador por si
  la CSP bloquea algo (la revisión se documenta en `evidence/individual.md`).
- No se ejecutó ninguna prueba de penetración ni escáner automático externo.
- `robots.txt` pide a los buscadores que no indexen `/api/` ni `/inspecciones/`, pero es público y se respeta solo por
  cortesía. **No es un control de seguridad.**
- No hay HTTPS ni HSTS en este repositorio: dependen del hosting.
- No hay autenticación, autorización ni bitácora de auditoría.

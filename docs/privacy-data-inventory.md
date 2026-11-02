# Inventario de datos y privacidad

Proyecto: PWA de inspecciones de laboratorio. Este documento lista qué datos maneja la app, dónde viven, cuánto tiempo, quién los puede ver y qué controles los protegen. Regla principal: **solo datos sintéticos**.

## 1. Principios

- **Solo datos sintéticos.** Los nombres de inspectores son alias ("Técnica A"), no personas reales.
- **Minimización.** No se pide nada que la app no necesite: no hay cuentas, correos, teléfonos ni ubicación.
- **Sin terceros.** No hay analítica, anuncios, fuentes externas ni peticiones a otros dominios.
- **Permisos bajo demanda.** Un permiso del navegador solo se pide cuando la persona presiona un botón.

## 2. Datos que maneja la app

Cada inspección tiene estos campos (`src/lib/data/inspections.ts`):

- `id` (ejemplo `inspection-001`): identificador técnico. No es dato personal. Se valida con lista permitida.
- `location` (ejemplo "Laboratorio de Redes"): lugar. No es dato personal. Máximo 80 caracteres.
- `date` (ejemplo `2026-08-28`): fecha de la revisión. Debe ser una fecha real `AAAA-MM-DD`.
- `inspector` (ejemplo "Técnica A"): **alias sintético**. Si fuera un nombre real sería dato personal, por eso se rechazan correos, teléfonos y CURP y se limita a 60 caracteres.
- `status` y `statusLabel` (ejemplo `ok`, "Sin incidencias"): estado de la inspección. Sin riesgo.
- `findings` (ejemplo `0` o `2`): número de hallazgos. Entero de 0 a 999, coherente con el estado.
- `summary` (ejemplo "Revisión visual de cableado..."): texto libre. **Es el campo de más riesgo**, porque es donde alguien podría escribir un dato personal. Máximo 280 caracteres, sin `<` ni `>`, y se revisa contra PII.

La cola offline agrega metadatos técnicos por operación: `operationId`, `inspectionId`, `type`, `createdAt`, `status`, `attempts` y `lastError`. No contienen datos personales; `lastError` está limitado a 300 caracteres.

## 3. Dónde se guardan

- **Código fuente** (`src/lib/data/inspections.ts`): las 3 inspecciones sintéticas. Es la "base de datos" actual.
- **Respuesta de la API**: se genera en cada petición y no se guarda en el servidor.
- **`localStorage`** del navegador, clave `inspecciones-lab:sync-queue:v1`: la cola de operaciones pendientes. Se lee y se valida en cada uso (ver `docs/threat-model.md`, T1).
- **Caché del service worker** (`inspecciones-lab-v1`): páginas, iconos y respuestas GET que ya se visitaron, para que la app funcione sin conexión.
- **Servidor o hosting**: puede registrar direcciones IP y rutas en sus bitácoras. Eso depende del proveedor y no lo controla este repositorio.

## 4. Datos que NO se recogen

- No se piden ni se guardan nombres reales, correos, teléfonos, CURP ni direcciones.
- No se guardan fotos, audio ni coordenadas: la cámara y la ubicación no están conectadas a ninguna pantalla.
- La app no establece cookies (lo comprueba una prueba e2e) ni usa analítica o rastreadores.
- No se hacen peticiones a otros dominios (la CSP solo permite `'self'`).

## 5. Permisos del navegador

- **Notificaciones**: se usan. Solo se pide permiso al presionar "Activar notificaciones" y no se vuelve a preguntar si la persona ya contestó (`src/lib/notifications/client.ts`).
- **Cámara**: existe el módulo `src/lib/device/camera.ts` (pide solo video, nunca audio), pero **no está conectado a ninguna pantalla**. La política `Permissions-Policy` la niega (`camera=()`).
- **Ubicación**: igual que la cámara (`src/lib/device/geolocation.ts`, `geolocation=()`).
- **Micrófono**: nunca se usa y está negado (`microphone=()`).

Si se conecta la cámara o la ubicación, hay que (1) cambiar la política en `src/lib/security/headers.ts`, (2) agregar el dato a este inventario y (3) explicar en pantalla para qué se pide.

## 6. Retención y borrado

- **Cola offline**: las operaciones sincronizadas se quedan con estado `synced` y no se borran solas. Es un límite conocido; no contienen datos personales.
- **Caché del service worker**: se reemplaza cuando cambia el nombre de la caché y se limpia al activar una versión nueva.
- **Cómo borrar todo en un navegador**: DevTools -> Application -> Storage -> "Clear site data", o desde la configuración del navegador "Borrar datos del sitio".
- No hay copia de los datos en el servidor, así que no hay nada más que borrar.

## 7. Controles técnicos que protegen la privacidad

- `validateInspectionPayload` rechaza correos, teléfonos y CURP en los campos de texto (`src/lib/security/privacy.ts`).
- Límites de longitud, lista permitida de campos y rechazo de `<` y `>` (`src/lib/security/validation.ts`).
- `redactPII` y `redactSecrets` sirven para ocultar datos antes de mostrarlos o registrarlos.
- Cabeceras: `Referrer-Policy: same-origin` (no se manda la URL a otros sitios), `Permissions-Policy` y CSP con `connect-src 'self'`.
- Pruebas: `tests/security.spec.ts` (PII y validación), `tests/integration/seguridad.spec.ts` (cola manipulada) y `tests/e2e/seguridad.spec.mjs` (cabeceras, cookies y CORS por HTTP).

## 8. Riesgos de privacidad y límites

- La detección de PII usa patrones. Detecta correos, teléfonos y CURP con formato estándar, pero **no detecta nombres propios ni direcciones** escritos en texto libre.
- En una computadora compartida del laboratorio, la caché y `localStorage` siguen en el navegador hasta que alguien los borre. Como los datos son sintéticos, el riesgo se acepta por ahora.
- No hay aviso de privacidad ni consentimiento en la interfaz porque no se recogen datos personales. Si algún día se usaran datos reales, habría que agregar ambos y revisar la ley mexicana de protección de datos personales.
- No hay cuentas ni control de acceso: quien abre la URL ve todo lo que contiene la app.
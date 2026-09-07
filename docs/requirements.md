# Requisitos del producto — documento del equipo

1. Problema y contexto

Los laboratorios de la UTT (Redes, Electrónica, Software, entre otros) requieren un registro confiable de sus inspecciones de mantenimiento: quién la realizó, cuándo, qué se encontró y si el laboratorio queda "sin incidencias" o "requiere atención". Un registro interrumpido por la falta de conexión dificulta dar seguimiento a un hallazgo: si la técnica pierde su captura al quedarse sin señal, el laboratorio puede seguir usándose sin que nadie sepa que hay una observación pendiente.

Queda fuera de esta etapa: la gestión de órdenes de trabajo derivadas de un hallazgo, la notificación automática a terceros y cualquier integración con inventario o compras. Tampoco se implementan aún manifest, service worker, sincronización offline real ni autenticación.

2. Usuarios y escenarios

Usuarios: técnico/a de laboratorio (realiza la inspección) y encargado/a de laboratorio (revisa el historial y decide si se requiere una acción).

Escenario 1 — Registro con conectividad intermitente Situación inicial: una técnica termina de revisar el Laboratorio de Electrónica y detecta dos hallazgos, pero la señal WiFi del edificio se corta momentáneamente. Acción: la técnica registra el hallazgo sin conexión y espera conservarlo para enviarlo después. Resultado esperado: el hallazgo no se pierde y queda disponible para enviarse en cuanto haya conexión (capacidad futura; en Semana 1 solo se documenta, no se implementa).

Escenario 2 — Consulta del estado de un laboratorio Situación inicial: un encargado quiere saber si el Laboratorio de Software tiene hallazgos pendientes antes de autorizar su uso. Acción: el encargado abre la app y consulta las inspecciones recientes de ese laboratorio. Resultado esperado: ve la fecha de la última inspección, el responsable, el estado ("Sin incidencias" / "Requiere atención") y el número de hallazgos.

3. Requisitos funcionales
ID	Acción del producto	Condición observable de aceptación	Ahora o futuro
RF-01	Mostrar los registros sintéticos del starter	Al abrir la página se ven las tres inspecciones proporcionadas (Redes, Electrónica, Software)	Semana 1
RF-02	Registrar una inspección con laboratorio, fecha, responsable, descripción y hallazgos	Al guardar datos válidos, aparece un nuevo registro con esos mismos valores en la lista	Futuro
RF-03	Calcular el estado de una inspección según su número de hallazgos	Una inspección con 0 hallazgos se muestra como "Sin incidencias"; con 1 o más, como "Requiere atención"	Semana 1 (ya lo hace el starter)
RF-04	Filtrar el historial de inspecciones por laboratorio	Al elegir un laboratorio, solo se muestran sus inspecciones	Futuro
RF-05	Conservar una inspección capturada sin conexión y enviarla al recuperar conectividad	Una inspección capturada sin conexión aparece en la lista general al reconectar, sin duplicados	Futuro
4. Requisitos no funcionales
Reproducibilidad (ahora): en una copia limpia, con las versiones declaradas de Node y npm, npm ci y npm run verify terminan con código 0.
Accesibilidad (ahora): las tarjetas de inspección mantienen suficiente contraste de texto y siguen siendo legibles con el zoom del navegador al 150%; se comprueba de forma visual.
Seguridad (ahora): ninguna credencial, token o variable de entorno se expone en el repositorio; se comprueba revisando que .env esté en .gitignore y no aparezca en commits.
Privacidad (ahora): los datos mostrados son sintéticos (nombres de ejemplo, no personas reales); se comprueba revisando que los datos de demostración no correspondan a alumnos o técnicos reales.
Rendimiento (meta futura, ilustrativa): con 100 registros sintéticos en el dispositivo de prueba declarado, el listado aparece en menos de 2 segundos; se medirá en cinco ejecuciones bajo la conexión definida. Esta cifra es ilustrativa, no un resultado ya medido.
Operación offline (futuro): el producto deberá seguir mostrando las últimas inspecciones cargadas aunque no haya conexión; se comprobará cuando se implemente el service worker.
5. Datos sintéticos y límites

Se usan exclusivamente datos ficticios: nombres de laboratorio genéricos (Redes, Electrónica, Software), responsables con nombres de ejemplo (Técnica A, Técnico B, Técnica C) y hallazgos redactados de forma sintética.

Se excluyen: nombres reales de alumnos o docentes, matrículas, correos institucionales, fotografías reales de equipo o instalaciones, y credenciales. La identificación académica de los integrantes se registra solo en la evidencia del repositorio privado y en Classroom.

6. Criterios de aceptación de la Semana 1
Prueba del starter → npm run verify (ejecuta la prueba proporcionada y genera reports/verification.json).
Build → npm ci y npm run dev corren sin errores; se ve la pantalla con las tres inspecciones sintéticas en http://localhost:3000.
Requisitos verificables → revisión de este documento (secciones 1 a 5).
Comparación de alternativas → revisión de docs/decision-record.md.

npm run verify en verde confirma la parte técnica (instalación, prueba, build); no valida por sí solo la calidad del análisis de este documento.
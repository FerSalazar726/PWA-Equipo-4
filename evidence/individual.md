# Evidencia individual del equipo

> Un solo archivo compartido. Repitan la sección siguiente por cada integrante; cada persona escribe y explica su propia evidencia. Se aceptan evidencias previas equivalentes. El SHA final se entrega en Classroom después del último commit, para evitar modificar el commit que se está identificando.

- Grupo y equipo: 10A Equipo04
- Repositorio del equipo: https://github.com/FerSalazar726/PWA-Equipo-4

## Integrante: Jarumi

- Mi contribución concreta y enlace a archivo, commit anterior o revisión: revisé `docs/requirements.md` y `docs/decision-record.md` completos, ejecuté `bash public-tests/check.sh` y verifiqué el proyecto corriendo en local. Detecté que ambos documentos estaban aún vacíos (solo plantilla) y lo reporté al equipo antes de que se llenaran; después volví a revisarlos ya con el contenido real.
- Decisión que puedo explicar y por qué: no sobrescribí ni completé yo misma los documentos cuando los encontré vacíos, porque mi tarea era revisar/corregir contenido existente, no redactarlo desde cero por mi cuenta; en vez de eso avisé al equipo para que quien correspondía lo completara y evitar duplicar o pisar trabajo.
- Comando o prueba proporcionada que ejecuté: `bash public-tests/check.sh`, `npm ci` y `npm run dev`.
- Resultado real que observé: `check.sh` respondió "Estructura presente"; `npm ci` instaló 28 paquetes sin errores (solo 2 advertencias de vulnerabilidad, no bloqueantes); `npm run dev` levantó el servidor ("Ready", "Compiled", `GET / 200`) y en `http://localhost:3000` se ven las 3 inspecciones sintéticas con su responsable, fecha y número de hallazgos.
- Qué verifica esa prueba y qué no verifica: `check.sh` verifica que los archivos y carpetas esperados existan, no revisa su contenido. `npm run dev` confirma que el proyecto compila y corre, y me permitió comprobar visualmente que el RF-03 (calcular "Sin incidencias" / "Requiere atención" según el número de hallazgos) funciona como describe el documento: Redes y Software (0 hallazgos) muestran "Sin incidencias", Electrónica (2 hallazgos) muestra "Requiere atención". Ninguno de los dos comandos valida la operación offline, la sincronización ni el manifest, porque aún no están implementados (quedan marcados como "Futuro" en el propio documento).
- Limitación, dificultad o riesgo que identifiqué: : tuve problemas iniciales para clonar el repositorio porque tenía credenciales de otra cuenta de GitHub guardadas en Windows, tuve que limpiarlas para poder acceder;
- Uso de IA: herramienta, propósito, partes influenciadas y validación propia:La use   para dudas técnicas de Git y terminal — resolver un error de credenciales de GitHub cacheadas con la cuenta incorrecta al clonar el repositorio, y para saber cómo correr `bash public-tests/check.sh` en Windows usando Git Bash en vez de PowerShell. La lectura y revisión de contenido de los documentos, y la verificación del comportamiento del proyecto en el navegador, las hice yo directamente.

> No necesitan inventar un error ni escribir pruebas nuevas. «Ejecuté npm test» es insuficiente como explicación: indiquen qué observa la prueba y qué comportamiento queda fuera.

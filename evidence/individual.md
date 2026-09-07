# Evidencia individual del equipo

> Un solo archivo compartido. Repitan la sección siguiente por cada integrante; cada persona escribe y explica su propia evidencia. Se aceptan evidencias previas equivalentes. El SHA final se entrega en Classroom después del último commit, para evitar modificar el commit que se está identificando.

- Grupo y equipo:
- Repositorio del equipo:

## Integrante: escribir nombre

- Mi contribución concreta y enlace a archivo, commit anterior o revisión:
- Decisión que puedo explicar y por qué:
- Comando o prueba proporcionada que ejecuté:
- Resultado real que observé:
- Qué verifica esa prueba y qué no verifica:
- Limitación, dificultad o riesgo que identifiqué:
- Uso de IA: herramienta, propósito, partes influenciadas y validación propia (o «no utilicé IA»):

> No necesitan inventar un error ni escribir pruebas nuevas. «Ejecuté npm test» es insuficiente como explicación: indiquen qué observa la prueba y qué comportamiento queda fuera.

## Integrante: Oscar

- Mi contribución concreta y enlace a archivo, commit anterior o revisión: confirmé que el starter se puede instalar y ejecutar en mi máquina; revisé la pantalla inicial y esta evidencia queda registrada en `evidence/individual.md`.
- Decisión que puedo explicar y por qué: mantuve el alcance del starter sin implementar todavía funcionalidades PWA. Esta semana corresponde comprobar la reproducibilidad y documentar el producto, no agregar instalación, offline o sincronización.
- Comando o prueba proporcionada que ejecuté: `git pull`, `npm ci`, `npm run dev` y `npm run verify`. También comprobé `http://localhost:3000` con una respuesta HTTP y revisé que mostrara las inspecciones de Redes, Electrónica y Software.
- Resultado real que observé: `npm ci` terminó correctamente; el servidor devolvió `200 OK` y mostró las tres inspecciones sintéticas. `npm run verify` terminó con `Verificación técnica: pass`, ejecutó `starter.spec.mjs: PASS`, compiló Next.js y generó `reports/verification.json`. Usé Node.js `v22.22.0` y npm `10.9.4`.
- Qué verifica esa prueba y qué no verifica: comprueba la instalación reproducible mediante el lockfile, la prueba proporcionada, la compilación y que la pantalla inicial responda con los tres registros esperados. No comprueba todavía instalación como PWA, service worker, funcionamiento offline, sincronización, autenticación, persistencia de datos, accesibilidad completa ni la calidad académica de los documentos.
- Limitación, dificultad o riesgo que identifiqué: al ejecutar el build mientras el servidor de desarrollo seguía activo, el artefacto local `.next` quedó inconsistente y produjo un error de módulo faltante. Eliminé únicamente ese artefacto generado y reinicié `npm run dev`; después la página respondió correctamente. Esto muestra que conviene no reutilizar el mismo estado de `.next` entre build y desarrollo.
- Uso de IA: utilicé GitHub Copilot para revisar los comandos del proyecto, organizar esta redacción y analizar el error local. Validé cada afirmación ejecutando los comandos, revisando sus salidas y comprobando la respuesta HTTP; no delegué la decisión ni presenté como verificado algo que no ejecuté.

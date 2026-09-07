# ADR-001 — Decisión sobre la estrategia de aplicación

# Estado

Propuesta y aceptada por el equipo el 6 de septiembre de 2026, para la entrega de Semana 1.

# Contexto y restricciones

El producto es "Inspecciones de laboratorio": técnicos y encargados de laboratorio (Redes,
Electrónica, Software) registran y consultan inspecciones de mantenimiento. Los usuarios operan
desde dispositivos móviles o de escritorio dentro del campus, donde la conectividad WiFi puede
cortarse momentáneamente (ver Escenario 1 de `docs/requirements.md`). Los datos son sintéticos y
no requieren un backend con información sensible en esta etapa. El curso fija Next.js como base
técnica y una trayectoria PWA como estrategia general.

Restricciones que influyen en la decisión:
- Necesidad de seguir consultando/registrando inspecciones aunque falle la conexión (RF-05,
  requisito no funcional de operación offline).
- Un solo repositorio y un solo despliegue por equipo, sin presupuesto para desarrollo nativo
  por separado en Android/iOS.
- Alcance de Semana 1: no se implementa aún manifest, service worker ni sincronización real;
  la decisión se justifica para guiar el desarrollo de las semanas siguientes.

# Alternativas consideradas

| Criterio | PWA | Web tradicional | App nativa | Multiplataforma (ej. React Native/Flutter) |
|---|---|---|---|---|
| Instalación | Se instala desde el navegador, sin tienda de apps | No se instala, siempre requiere navegador | Requiere tienda de apps (Play Store/App Store) | Requiere tienda de apps |
| Conexión intermitente | Puede seguir funcionando con datos en caché una vez que se implemente el service worker | Deja de funcionar si no hay conexión | Puede funcionar offline de forma nativa, con más control del sistema | Puede funcionar offline, depende del framework |
| Distribución | Un solo link, actualizaciones inmediatas al desplegar | Igual que PWA en distribución | Depende de revisión y aprobación de la tienda | Depende de revisión y aprobación de la tienda |
| Costo de desarrollo | Un solo código base (Next.js), el que ya trae el starter | Un solo código base, similar a PWA | Requiere un desarrollo distinto por plataforma (o dos equipos) | Un código base, pero con capa adicional para acceder a APIs nativas |
| Mantenimiento | Un solo repositorio a mantener | Un solo repositorio a mantener | Mantenimiento duplicado por plataforma | Mantenimiento de una capa extra sobre el framework multiplataforma |
| Acceso al dispositivo | Acceso limitado (cámara, notificaciones básicas, almacenamiento local) | Muy limitado, depende del navegador | Acceso completo a todas las capacidades del dispositivo | Acceso amplio, aunque con dependencias de plugins |
| Riesgos | La operación offline no es automática: requiere diseñar almacenamiento local y sincronización; no aparece solo por usar React | No resuelve la conectividad intermitente, que es un requisito central del caso | Mayor costo y tiempo de desarrollo que no se justifica para el alcance de este curso | Curva de aprendizaje adicional del framework, sin ganar mucho sobre la PWA para este caso |

No se construyeron prototipos de las cuatro opciones; la comparación se basa en las
características documentadas de cada enfoque frente a las restricciones del caso.

# Decisión

Se mantiene la estrategia PWA con Next.js fijada por el curso. Es adecuada porque el problema
central (consultar y registrar inspecciones con conectividad intermitente, sin presupuesto para
apps nativas por plataforma) se resuelve mejor con un solo código base instalable, sin tienda de
apps, que en semanas futuras pueda agregar almacenamiento local y sincronización mediante un
service worker.

Una app nativa sería preferible si el producto necesitara acceso profundo y constante a hardware
del dispositivo (por ejemplo, sensores especializados) o si el equipo contara con recursos para
mantener versiones separadas por plataforma; ninguno de esos supuestos aplica a este caso. Para
esta entrega se conserva el starter Next.js: comparar alternativas no implica cambiar el stack
ni construir las cuatro opciones.

# Consecuencias y riesgos

- **Beneficio:** un solo despliegue y código base reduce el trabajo de mantenimiento del equipo
  durante el curso.
- **Costo:** la operación offline no viene "gratis" por elegir PWA; el equipo deberá diseñar en
  semanas futuras cómo se guardan localmente las inspecciones y cómo se resuelven conflictos si
  dos personas editan el mismo registro sin conexión.
- **Riesgo:** si no se implementa bien la sincronización, una inspección capturada sin conexión
  podría perderse o duplicarse al reconectar.
- **Mitigación planeada:** documentar primero el comportamiento esperado (RF-05 en
  `docs/requirements.md`) antes de implementar el service worker, y probarlo con casos concretos
  de reconexión antes de darlo por terminado.

# Validación

En semanas posteriores se validará: (1) que una inspección capturada sin conexión aparezca en la
lista general al recuperar la conexión, sin duplicados; (2) que el tiempo de carga del listado
se mantenga bajo el umbral definido en los requisitos no funcionales al crecer el número de
registros. Por ahora no se ha implementado ni probado la sincronización offline, los permisos ni
el manifest; este documento solo describe el plan para validarlos cuando existan.
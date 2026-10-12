# Capacidades del dispositivo y notificaciones

## Alcance

Esta semana el proyecto integra tres capacidades opcionales del navegador,
todas con datos sinteticos y permisos minimos:

- **Camara** (`src/lib/device/camera.ts`): pide acceso de video unicamente,
  nunca audio, y solo cuando el usuario activa una accion explicita.
- **Geolocalizacion** (`src/lib/device/geolocation.ts`): pide la posicion
  actual una sola vez (no observa cambios continuos) y con un timeout de
  5 segundos para no dejar la peticion colgada.
- **Notificaciones** (`src/lib/notifications/client.ts`): pide permiso solo
  si el estado es "default"; si ya fue concedido o negado antes, no vuelve
  a preguntar.

## Decision tecnica: permisos minimos y bajo demanda

Las tres capacidades comparten el mismo patron: una funcion `hasX()` que
comprueba si el navegador soporta la API antes de usarla (igual que
`hasLocalStorage()` de la Semana 5), y el permiso se solicita unicamente
cuando el usuario presiona un boton, nunca automaticamente al cargar la
pagina. Esto evita bloquear el render en el servidor (Next.js) y evita pedir
permisos que el usuario no sabe por que se piden.

## Fallback cuando no hay soporte o el permiso se niega

- Si el navegador no soporta la API: las funciones regresan
  `{ ok: false, reason: "unsupported" }` (o `"unsupported"` en
  notificaciones) y la interfaz no muestra el boton correspondiente, en vez
  de mostrar un boton roto.
- Si el usuario niega el permiso: se regresa `{ ok: false, reason: "denied" }`
  y la interfaz muestra un mensaje explicando que esta bloqueado, sin volver
  a insistir.
- Geolocalizacion ademas distingue `"timeout"` de `"denied"` porque son
  causas distintas (el usuario no respondio a tiempo vs. lo rechazo).

## Limites conocidos

- La camara solo pide el stream y lo puede detener (`stopCamera`); esta
  semana no se integra una vista previa de video en pantalla, eso queda
  pendiente para una iteracion futura.
- La geolocalizacion no guarda historial de ubicaciones, solo la lectura
  mas reciente.
- Todo el trabajo usa datos sinteticos; no se solicitan ni almacenan datos
  personales reales.

## Uso de IA

Se usó Claude para ayudar a diagnosticar errores de pruebas y redactar documentación. Un integrante del equipo ejecutó `npm test` y revisó manualmente el resultado antes de integrarlo.
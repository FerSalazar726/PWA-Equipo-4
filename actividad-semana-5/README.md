# Actividad Semana 5

Nombre completo: Oscar Flores Cerqueda
Grupo: 10A
Fecha: 29 de septiembre de 2026

## Respuestas

1. **¿Qué significa `pending`?** La operación está guardada en la cola y espera su envío al servidor.
2. **¿Qué significa `inFlight`?** La petición está en curso. Todavía no sabemos si el servidor la procesó correctamente.
3. **¿Qué significa `failed`?** El intento de envío falló. La operación se conserva para poder reintentar.
4. **¿Qué significa `done`?** El servidor respondió con éxito y confirmó que procesó la operación.
5. **¿Por qué no marcar `done` antes de una respuesta exitosa?** Porque enviar no garantiza que el servidor procese la venta. Si falla y ya la marcamos como terminada, mostraríamos un resultado falso y no volveríamos a enviarla.
6. **¿Qué pasa si solo usamos `let queue = []` y recargamos?** La memoria de JavaScript se reinicia y se pierden las operaciones. Guardar y recuperar la cola desde `localStorage` permite conservarlas.
7. **¿Para qué sirve `operationId`?** Identifica de forma única cada operación, incluso si dos ventas tienen el mismo producto y cantidad. Conservamos ese identificador al reintentar. Un servidor real podría usarlo para evitar duplicados; esta simulación no implementa ese servidor.
8. **Explicación del flujo:** La venta comienza en `pending`. Al sincronizar cambia a `inFlight` mientras espera la respuesta. Si ocurre un error pasa a `failed`. El botón Reintentar la devuelve a `pending`, conservando su ID. Al sincronizar otra vez pasa a `inFlight` y, únicamente si la respuesta es exitosa, termina en `done`.

## Cómo ejecutar

Esta carpeta es una aplicación independiente de la PWA del equipo. Solo utiliza HTML, CSS, JavaScript y `localStorage`; no necesita instalar paquetes.

Desde la raíz del repositorio, servir la carpeta con un servidor estático, por ejemplo:

```sh
python -m http.server 8085 --bind 127.0.0.1 --directory actividad-semana-5
```

Abrir `http://127.0.0.1:8085`. Usar localhost o HTTPS para disponer de `crypto.randomUUID()`. Mantener el mismo origen y navegador para recuperar las ventas guardadas.

## Comprobación del flujo

1. Registrar Coca-Cola con cantidad 2: aparece `pending`, su ID y los atributos `data-operation-id` y `data-status`.
2. Recargar: se conserva la venta con el mismo ID; la clave de almacenamiento es `operations`.
3. Sincronizar: aparece `inFlight` durante unos dos segundos y después `failed` o `done`.
4. Si aparece `failed`, pulsar Reintentar: vuelve a `pending`. Volver a sincronizar hasta obtener `done`.
5. Registrar otra venta y sincronizar: las ventas `done` no se vuelven a enviar y las `failed` esperan un reintento explícito.

El servidor simulado utiliza `Math.random() > 0.4`: aproximadamente 60 % de éxito y 40 % de error. No se conecta a una API. Registrar una venta no requiere conexión; esta actividad no incluye un service worker que permita cargar la página desde la red estando offline.

El botón de sincronización se bloquea durante un envío para evitar ejecuciones simultáneas. Si se recarga durante `inFlight`, la operación se recupera como `failed` y requiere Reintentar. El formulario rechaza productos vacíos y cantidades no enteras o menores que uno. Los productos se muestran como texto, sin ejecutar HTML.

## Evidencias

- [01-pending.png](evidencias/01-pending.png): venta registrada.
- [02-persistencia.png](evidencias/02-persistencia.png): misma venta e ID después de recargar.
- [03-failed.png](evidencias/03-failed.png): respuesta fallida y botón Reintentar.
- [04-done.png](evidencias/04-done.png): respuesta exitosa después del reintento.

Las capturas corresponden a la aplicación ejecutándose en Microsoft Edge. Las respuestas anteriores son una guía para estudiar el funcionamiento y explicarlo con tus propias palabras.

# Politica de sincronizacion

## Persistencia local

Las operaciones pendientes (crear o actualizar una inspeccion) se guardan en
localStorage bajo la llave inspecciones-lab:sync-queue:v1, como una lista de
objetos SyncOperation (ver src/lib/storage/schema.ts). Si localStorage no
esta disponible (por ejemplo, durante el renderizado en el servidor), las
funciones de la cola no hacen nada en vez de fallar.

## Idempotencia (evitar duplicados)

Cada operacion lleva un operationId generado en el cliente (llave de
idempotencia). Antes de agregar una operacion a la cola, se revisa que no
exista ya una con el mismo operationId; si ya existe, no se duplica. Esto
evita que, por ejemplo, un doble clic accidental en "guardar" cree dos
copias de la misma inspeccion.

## Reintentos

Cada operacion pendiente guarda cuantos intentos de sincronizacion ha
tenido (attempts). syncQueue() intenta enviar cada operacion pendiente o
con error; si falla, incrementa attempts y guarda el ultimo error. Despues
de 3 intentos fallidos, la operacion deja de reintentarse automaticamente,
aunque sigue visible en la cola para que la UI pueda mostrarla.

## Resolucion de conflictos

Se usa la politica "el cambio mas reciente gana" (last-write-wins):
resolveConflict() compara la fecha de la operacion local (createdAt) contra
la fecha de actualizacion del lado remoto (updatedAt) y se queda con el
payload de quien sea mas reciente. Se eligio esta politica por ser simple
de explicar e implementar sin necesitar una fusion campo por campo, a costa
de poder perder un cambio legitimo si dos ediciones ocurren casi al mismo
tiempo.

## Limites de esta semana

No existe todavia un backend real que reciba estas operaciones: syncQueue()
recibe como parametro la funcion que "envia" cada operacion, para poder
probarla sin depender de una red real. La resolucion de conflictos se
prueba de forma aislada, pero no esta conectada todavia a una ruta de API
real que devuelva el estado remoto.
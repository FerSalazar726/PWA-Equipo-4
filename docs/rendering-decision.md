# Decision de renderizado: CSR vs SSR

## Que se comparo

- **/inspecciones (listado): Server-Side Rendering (SSR).** Sin "use client".
  El servidor resuelve los datos (getInspections()) y genera el HTML
  completo antes de enviarlo.
- **/inspecciones/[id] (detalle): Client-Side Rendering (CSR).** Con
  "use client". El navegador hace fetch() a /api/inspecciones/[id] y
  muestra loading/error/vacio mientras tanto.

## Por que esta combinacion

El listado es la primera pantalla, conviene que cargue rapido y visible
sin depender de JavaScript adicional (bueno para conexion intermitente).
El detalle es secundario y permite demostrar claramente los 3 estados
verificables que pide la actividad.

## Trade-offs

- SSR (listado): contenido inmediato, pero se recalcula en cada peticion.
- CSR (detalle): permite estados explicitos, pero no muestra nada util si
  JavaScript falla o esta desactivado.

## Relacion con el service worker (Semana 3)

Ambas rutas usan peticiones GET, asi que el service worker existente las
puede cachear con la misma estrategia stale-while-revalidate.

## Limites de esta semana

No hay ISR ni revalidate de Next.js; no hay paginacion (solo 3 registros).
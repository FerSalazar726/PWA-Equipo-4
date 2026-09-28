import Link from "next/link";
import { getInspections } from "@/lib/data/inspections";

// Server-Side Rendering (SSR): esta pagina no lleva "use client".
// Se genera en el servidor en cada solicitud, con los datos ya resueltos
// antes de enviar el HTML al navegador (no hay fetch desde el cliente).
export const dynamic = "force-dynamic";
export default async function InspeccionesPage() {
  const inspections = await getInspections();

  return (
    <main className="page-shell">
      <h1>Listado de inspecciones (SSR)</h1>
      <p>
        Esta pagina se renderiza en el servidor: los datos ya vienen
        resueltos en el HTML inicial, sin esperar una peticion desde el
        navegador.
      </p>
      <ul>
        {inspections.map((inspection) => (
          <li key={inspection.id}>
            <Link href={`/inspecciones/${inspection.id}`}>
              {inspection.location} - {inspection.date}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LoadingState } from "@/components/loading-state";
import { ErrorState, EmptyState } from "@/components/app-shell";
import type { Inspection } from "@/lib/data/inspections";

// CSR: el HTML inicial muestra la carga; el navegador consulta el detalle por API.
export default function DetalleInspeccionPage() {
  const { id } = useParams<{ id: string }>();
  const [estado, setEstado] = useState<"loading" | "error" | "empty" | "success">("loading");
  const [inspection, setInspection] = useState<Inspection | null>(null);

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    async function cargar() {
      setEstado("loading");
      setInspection(null);
      try {
        const respuesta = await fetch(`/api/inspecciones/${encodeURIComponent(id)}`, {
          signal: controller.signal,
        });
        if (respuesta.status === 404) {
          if (!cancelado) setEstado("empty");
          return;
        }
        if (!respuesta.ok) throw new Error("Respuesta no válida del servidor");

        const datos: Inspection = await respuesta.json();
        if (!cancelado) {
          setInspection(datos);
          setEstado("success");
        }
      } catch {
        if (!cancelado) setEstado("error");
      }
    }

    void cargar();
    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [id]);

  return (
    <main className="page-shell">
      <Link href="/inspecciones">Volver al listado de inspecciones</Link>
      <h1>Detalle de inspección</h1>
      {estado === "loading" && <LoadingState />}
      {estado === "error" && (
        <ErrorState message="No se pudo cargar el detalle de la inspección." />
      )}
      {estado === "empty" && (
        <EmptyState
          title="No se encontró la inspección."
          message="Revisa el enlace o vuelve al listado para consultar una inspección disponible."
        />
      )}
      {estado === "success" && inspection && (
        <dl className="inspection-detail">
          <div><dt>Laboratorio</dt><dd>{inspection.location}</dd></div>
          <div><dt>Fecha</dt><dd>{inspection.date}</dd></div>
          <div><dt>Responsable</dt><dd>{inspection.inspector}</dd></div>
          <div><dt>Estado</dt><dd>{inspection.statusLabel}</dd></div>
          <div><dt>Hallazgos</dt><dd>{inspection.findings}</dd></div>
          <div><dt>Resumen</dt><dd>{inspection.summary}</dd></div>
        </dl>
      )}
    </main>
  );
}

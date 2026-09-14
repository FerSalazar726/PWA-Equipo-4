"use client";

// Pagina de Inspecciones de laboratorio: muestra los estados con datos sintéticos.

import { useEffect, useState } from "react";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/app-shell";

type Inspeccion = {
  id: string;
  laboratorio: string;
  fecha: string;
  responsable: string;
  hallazgos: number;
};

const inspeccionesSinteticas: Inspeccion[] = [
  { id: "1", laboratorio: "Laboratorio de Redes", fecha: "2026-08-28", responsable: "Tecnica A", hallazgos: 0 },
  { id: "2", laboratorio: "Laboratorio de Electronica", fecha: "2026-08-27", responsable: "Tecnico B", hallazgos: 2 },
  { id: "3", laboratorio: "Laboratorio de Software", fecha: "2026-08-26", responsable: "Tecnica C", hallazgos: 0 },
];

// Cambia este valor para probar cada estado a mano: "loading" | "error" | "empty" | "success"
      const ESTADO_DE_PRUEBA: "loading" | "error" | "empty" | "success" = "success";
export default function Page() {
  const [estado, setEstado] = useState<"loading" | "error" | "empty" | "success">("loading");
  const [datos, setDatos] = useState<Inspeccion[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (ESTADO_DE_PRUEBA === "error") {
        setEstado("error");
      } else if (ESTADO_DE_PRUEBA === "empty") {
        setDatos([]);
        setEstado("empty");
      } else {
        setDatos(inspeccionesSinteticas);
        setEstado("success");
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      {estado === "loading" && <LoadingState />}
      {estado === "error" && (
        <ErrorState message="No se pudo cargar la informacion." />
      )}
      {estado === "empty" && <EmptyState />}
      {estado === "success" && (
        <ul>
          {datos.map((inspeccion) => (
            <li key={inspeccion.id}>
              <strong>{inspeccion.laboratorio}</strong> - {inspeccion.fecha} -{" "}
              {inspeccion.responsable} - Hallazgos: {inspeccion.hallazgos}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

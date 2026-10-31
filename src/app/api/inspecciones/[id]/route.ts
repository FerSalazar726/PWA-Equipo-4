import { NextResponse } from "next/server";
import { getInspectionById } from "@/lib/data/inspections";
import { isValidInspectionId } from "@/lib/security/validation";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // Valida el id antes de tocar la capa de datos. Un id con formato invalido
  // recibe la misma respuesta que uno inexistente, para no dar pistas.
  const inspection = isValidInspectionId(params.id)
    ? await getInspectionById(params.id)
    : null;

  if (!inspection) {
    return NextResponse.json(
      { error: "No se encontro la inspeccion." },
      { status: 404 }
    );
  }

  return NextResponse.json(inspection);
}
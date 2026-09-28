import { NextResponse } from "next/server";
import { getInspectionById } from "@/lib/data/inspections";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const inspection = await getInspectionById(params.id);

  if (!inspection) {
    return NextResponse.json(
      { error: "No se encontro la inspeccion." },
      { status: 404 }
    );
  }

  return NextResponse.json(inspection);
}
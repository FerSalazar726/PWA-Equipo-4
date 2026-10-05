export type SyncOperationType = "create" | "update";
export type SyncStatus = "pending" | "synced" | "error";

export type InspectionPayload = {
  location: string;
  date: string;
  inspector: string;
  status: "ok" | "attention";
  statusLabel: string;
  findings: number;
  summary: string;
};

export type SyncOperation = {
  operationId: string; // llave de idempotencia, generada en el cliente
  inspectionId: string; // a cuál inspección aplica
  type: SyncOperationType;
  payload: InspectionPayload;
  createdAt: string; // ISO timestamp, usado para resolver conflictos
  status: SyncStatus;
  attempts: number;
  lastError?: string;
};

export const STORAGE_KEY = "inspecciones-lab:sync-queue:v1";

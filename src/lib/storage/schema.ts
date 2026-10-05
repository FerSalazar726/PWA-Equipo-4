export type InspectionPayload = {
  inspectionId: string;
  status: "ok" | "attention";
  findings: number;
  summary: string;
};

export type SyncOperation = {
  operationId: string;
  inspectionId: string;
  payload: InspectionPayload;
  createdAt: string;
  status: "pending" | "inFlight" | "failed" | "done";
};

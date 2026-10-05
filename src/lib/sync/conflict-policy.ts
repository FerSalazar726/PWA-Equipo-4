import type { InspectionPayload, SyncOperation } from "../storage/schema";

export type RemoteInspectionState = {
  inspectionId: string;
  payload: InspectionPayload;
  updatedAt: string;
};

export type ConflictResolution = {
  winner: "local" | "remote";
  payload: InspectionPayload;
  reason: string;
};

// Last-write-wins: ties favor local so a local edit is not silently discarded.
export function resolveConflict(
  local: SyncOperation,
  remote: RemoteInspectionState,
): ConflictResolution {
  const localTime = Date.parse(local.createdAt);
  const remoteTime = Date.parse(remote.updatedAt);

  if (!Number.isFinite(localTime) || !Number.isFinite(remoteTime)) {
    throw new RangeError("Las fechas local y remota deben ser timestamps ISO válidos.");
  }

  if (localTime >= remoteTime) {
    return {
      winner: "local",
      payload: local.payload,
      reason: "El cambio local es igual o más reciente que el remoto.",
    };
  }

  return {
    winner: "remote",
    payload: remote.payload,
    reason: "El cambio remoto es más reciente que el local.",
  };
}

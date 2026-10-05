import type { SyncOperation } from "../storage/schema";

const STORAGE_KEY = "inspection-sync-operations";

export function getPendingOperations(): SyncOperation[] {
  if (typeof window === "undefined") return [];

  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(
      (operation): operation is SyncOperation =>
        Boolean(operation) &&
        typeof operation === "object" &&
        operation.status === "pending" &&
        typeof operation.operationId === "string" &&
        typeof operation.createdAt === "string" &&
        Boolean(operation.payload) &&
        typeof operation.payload === "object",
    );
  } catch {
    return [];
  }
}

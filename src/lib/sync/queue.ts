import { SyncOperation, STORAGE_KEY } from "@/lib/storage/schema";

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readQueue(): SyncOperation[] {
  if (!hasLocalStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyncOperation[];
  } catch {
    return [];
  }
}

function writeQueue(queue: SyncOperation[]): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    // Por ejemplo, cuota de localStorage llena.
    console.error("No se pudo guardar la cola de sincronizacion", error);
  }
}

export function enqueueOperation(operation: SyncOperation): void {
  const queue = readQueue();
  // Idempotencia: si ya existe una operacion con el mismo operationId, no se duplica.
  const yaExiste = queue.some((op) => op.operationId === operation.operationId);
  if (yaExiste) return;
  queue.push(operation);
  writeQueue(queue);
}

export function updateOperation(
  operationId: string,
  cambios: Partial<SyncOperation>
): void {
  const queue = readQueue();
  const actualizada = queue.map((op) =>
    op.operationId === operationId ? { ...op, ...cambios } : op
  );
  writeQueue(actualizada);
}

export function removeOperation(operationId: string): void {
  const queue = readQueue();
  writeQueue(queue.filter((op) => op.operationId !== operationId));
}

export function getPendingOperations(): SyncOperation[] {
  return readQueue().filter(
    (op) => op.status === "pending" || op.status === "error"
  );
}

// Maximo de intentos acumulados por operacion (se cuenta entre llamadas a syncQueue).
const MAX_ATTEMPTS = 3;

export type EnviarOperacion = (
  operation: SyncOperation
) => Promise<{ ok: boolean; error?: string }>;

export async function syncQueue(enviar: EnviarOperacion): Promise<void> {
  const pendientes = getPendingOperations();

  for (const operacion of pendientes) {
    if (operacion.attempts >= MAX_ATTEMPTS) {
      continue;
    }

    let resultado: { ok: boolean; error?: string };
    try {
      resultado = await enviar(operacion);
    } catch (error) {
      // Un fallo de red no debe cortar el ciclo ni dejar de contar el intento.
      resultado = {
        ok: false,
        error: error instanceof Error ? error.message : "Error de red",
      };
    }

    if (resultado.ok) {
      updateOperation(operacion.operationId, { status: "synced" });
    } else {
      updateOperation(operacion.operationId, {
        status: "error",
        attempts: operacion.attempts + 1,
        lastError: resultado.error ?? "Error desconocido",
      });
    }
  }
}
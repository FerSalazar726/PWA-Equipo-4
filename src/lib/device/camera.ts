export type CameraSupport = "supported" | "unsupported" | "denied";

export type CameraResult =
  | { ok: true; stream: MediaStream }
  | { ok: false; reason: CameraSupport; error?: string };

function hasMediaDevices(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

export function isCameraSupported(): boolean {
  return hasMediaDevices();
}

// Permiso minimo: solo video, nunca audio, y solo se pide cuando el usuario
// activa una accion (no al cargar la pagina).
export async function requestCamera(): Promise<CameraResult> {
  if (!hasMediaDevices()) {
    return { ok: false, reason: "unsupported" };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    return { ok: true, stream };
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return { ok: false, reason: "denied", error: mensaje };
  }
}

// Libera la camara en cuanto deja de usarse.
export function stopCamera(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
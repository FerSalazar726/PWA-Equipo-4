export type GeolocationSupport = "supported" | "unsupported" | "denied" | "timeout";

export type GeolocationResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: GeolocationSupport; error?: string };

function hasGeolocation(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined";
}

export function isGeolocationSupported(): boolean {
  return hasGeolocation();
}

// timeoutMs evita que la peticion se quede esperando para siempre si el
// usuario nunca responde al permiso del sistema operativo.
export function requestLocation(timeoutMs = 5000): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!hasGeolocation()) {
      resolve({ ok: false, reason: "unsupported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        resolve({
          ok: true,
          latitude: posicion.coords.latitude,
          longitude: posicion.coords.longitude,
        });
      },
      (error) => {
        const razon: GeolocationSupport = error.code === error.TIMEOUT ? "timeout" : "denied";
        resolve({ ok: false, reason: razon, error: error.message });
      },
      { timeout: timeoutMs, maximumAge: 0 }
    );
  });
}
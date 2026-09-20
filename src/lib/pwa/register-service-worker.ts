export function registerServiceWorker() {
  if (typeof window === "undefined") {
    return;
  }
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service worker registrado:", registration.scope);
      })
      .catch((error) => {
        console.error("Error al registrar el service worker:", error);
      });
  });
}
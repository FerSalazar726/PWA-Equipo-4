export function registerServiceWorker() {
  if (typeof window === "undefined") {
    return;
  }
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const register = () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service worker registrado:", registration.scope);
      })
      .catch((error) => {
        console.error("Error al registrar el service worker:", error);
      });
  };

  // React may mount after the load event has already fired.
  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}

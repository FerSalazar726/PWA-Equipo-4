import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import {
  isCameraSupported,
  requestCamera,
  stopCamera,
} from "../src/lib/device/camera";
import {
  isGeolocationSupported,
  requestLocation,
} from "../src/lib/device/geolocation";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
} from "../src/lib/notifications/client";

const globalAny = globalThis as any;

afterEach(() => {
  delete globalAny.navigator;
  delete globalAny.window;
});

test("isCameraSupported es false sin navigator.mediaDevices", () => {
  assert.equal(isCameraSupported(), false);
});

test("requestCamera regresa unsupported si no hay mediaDevices", async () => {
  const resultado = await requestCamera();
  assert.equal(resultado.ok, false);
  if (!resultado.ok) assert.equal(resultado.reason, "unsupported");
});

test("requestCamera regresa el stream si el permiso se concede", async () => {
  const streamFalso: any = { getTracks: () => [{ stop: () => {} }] };
  globalAny.navigator = {
    mediaDevices: { getUserMedia: async () => streamFalso },
  };
  const resultado = await requestCamera();
  assert.equal(resultado.ok, true);
});

test("requestCamera regresa denied si el usuario rechaza el permiso", async () => {
  globalAny.navigator = {
    mediaDevices: {
      getUserMedia: async () => {
        throw new Error("Permission denied");
      },
    },
  };
  const resultado = await requestCamera();
  assert.equal(resultado.ok, false);
  if (!resultado.ok) assert.equal(resultado.reason, "denied");
});

test("stopCamera detiene todos los tracks del stream", () => {
  let detenido = false;
  const streamFalso: any = {
    getTracks: () => [
      {
        stop: () => {
          detenido = true;
        },
      },
    ],
  };
  stopCamera(streamFalso);
  assert.equal(detenido, true);
});

test("isGeolocationSupported es false sin navigator.geolocation", () => {
  assert.equal(isGeolocationSupported(), false);
});

test("requestLocation regresa unsupported si no hay geolocation", async () => {
  const resultado = await requestLocation();
  assert.equal(resultado.ok, false);
  if (!resultado.ok) assert.equal(resultado.reason, "unsupported");
});

test("requestLocation regresa coordenadas si el permiso se concede", async () => {
  globalAny.navigator = {
    geolocation: {
      getCurrentPosition: (exito: any) => {
        exito({ coords: { latitude: 19.4326, longitude: -99.1332 } });
      },
    },
  };
  const resultado = await requestLocation();
  assert.equal(resultado.ok, true);
  if (resultado.ok) {
    assert.equal(resultado.latitude, 19.4326);
    assert.equal(resultado.longitude, -99.1332);
  }
});

test("requestLocation regresa denied si el usuario rechaza el permiso", async () => {
  globalAny.navigator = {
    geolocation: {
      getCurrentPosition: (_exito: any, error: any) => {
        error({ code: 1, TIMEOUT: 3, message: "User denied Geolocation" });
      },
    },
  };
  const resultado = await requestLocation();
  assert.equal(resultado.ok, false);
  if (!resultado.ok) assert.equal(resultado.reason, "denied");
});

test("requestLocation regresa timeout si el permiso tarda demasiado", async () => {
  globalAny.navigator = {
    geolocation: {
      getCurrentPosition: (_exito: any, error: any) => {
        error({ code: 3, TIMEOUT: 3, message: "Timeout expired" });
      },
    },
  };
  const resultado = await requestLocation(100);
  assert.equal(resultado.ok, false);
  if (!resultado.ok) assert.equal(resultado.reason, "timeout");
});

test("isNotificationSupported es false sin window.Notification", () => {
  assert.equal(isNotificationSupported(), false);
});

test("getNotificationPermission regresa unsupported sin soporte", () => {
  assert.equal(getNotificationPermission(), "unsupported");
});

test("requestNotificationPermission pide permiso solo si esta en default", async () => {
  let solicitado = false;
  globalAny.window = {
    Notification: {
      permission: "default",
      requestPermission: async () => {
        solicitado = true;
        return "granted";
      },
    },
  };
  const resultado = await requestNotificationPermission();
  assert.equal(resultado, "granted");
  assert.equal(solicitado, true);
});

test("requestNotificationPermission no vuelve a preguntar si ya se respondio antes", async () => {
  let solicitado = false;
  globalAny.window = {
    Notification: {
      permission: "denied",
      requestPermission: async () => {
        solicitado = true;
        return "denied";
      },
    },
  };
  const resultado = await requestNotificationPermission();
  assert.equal(resultado, "denied");
  assert.equal(solicitado, false);
});

test("showNotification no crea nada si el permiso no esta concedido", () => {
  globalAny.window = { Notification: { permission: "denied" } };
  const resultado = showNotification("Hola");
  assert.equal(resultado, false);
});

test("showNotification crea la notificacion si el permiso esta concedido", () => {
  let creada = false;
  function NotificationFalsa(this: any, titulo: string) {
    creada = true;
  }
  NotificationFalsa.permission = "granted";
  globalAny.window = { Notification: NotificationFalsa };
  const resultado = showNotification("Hola");
  assert.equal(resultado, true);
  assert.equal(creada, true);
});
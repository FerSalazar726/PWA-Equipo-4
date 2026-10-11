"use client";

import { useEffect, useState } from "react";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from "../lib/notifications/client";

export function NotificationPermissionButton() {
  const [soportado, setSoportado] = useState(false);
  const [permiso, setPermiso] = useState<string>("default");

  useEffect(() => {
    setSoportado(isNotificationSupported());
    setPermiso(getNotificationPermission());
  }, []);

  if (!soportado) return null;
  if (permiso === "granted") {
    return <p role="status" className="notification-status">Notificaciones activadas</p>;
  }
  if (permiso === "denied") {
    return <p role="status" className="notification-status">Notificaciones bloqueadas desde el navegador</p>;
  }

  async function activar() {
    const resultado = await requestNotificationPermission();
    setPermiso(resultado);
  }

  return (
    <button type="button" className="notification-button" onClick={activar}>
      Activar notificaciones
    </button>
  );
}

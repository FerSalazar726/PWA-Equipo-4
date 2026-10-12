export type NotificationSupport = "supported" | "unsupported" | "denied";

function hasNotifications(): boolean {
  return typeof window !== "undefined" && typeof window.Notification !== "undefined";
}

export function isNotificationSupported(): boolean {
  return hasNotifications();
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!hasNotifications()) return "unsupported";
  return window.Notification.permission;
}

// Solo pide permiso si todavía está en "default"; respeta las decisiones previas.
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!hasNotifications()) return "unsupported";
  if (window.Notification.permission !== "default") {
    return window.Notification.permission;
  }
  return window.Notification.requestPermission();
}

export function showNotification(titulo: string, opciones?: NotificationOptions): boolean {
  if (!hasNotifications()) return false;
  if (window.Notification.permission !== "granted") return false;
  new window.Notification(titulo, opciones);
  return true;
}

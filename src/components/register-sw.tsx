"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa/register-service-worker";

export function RegisterSW() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
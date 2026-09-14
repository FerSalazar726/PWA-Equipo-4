import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inspecciones de Laboratorio",
  description: "Registro de inspecciones de mantenimiento de laboratorios de la UTT",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#173d35",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

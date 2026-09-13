import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inspecciones de Laboratorio",
  description: "Registro de inspecciones de mantenimiento de laboratorios de la UTT",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <main>
          <AppShell>{children}</AppShell>
        </main>
      </body>
    </html>
  );
}
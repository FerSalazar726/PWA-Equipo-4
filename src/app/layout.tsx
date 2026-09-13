import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

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


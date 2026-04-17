import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "agentes3d",
  description: "Oficina 3D para tus agentes Hermes",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

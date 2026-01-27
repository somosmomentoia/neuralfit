import type { Metadata } from "next";
import { Archivo_Narrow } from "next/font/google";
import "@/styles/globals.css";

const archivoNarrow = Archivo_Narrow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-archivo-narrow",
});

export const metadata: Metadata = {
  title: "NeuralFit - Gestión de Gimnasios",
  description: "Plataforma integral de gestión para gimnasios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={archivoNarrow.variable}>
      <body>{children}</body>
    </html>
  );
}

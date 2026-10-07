import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestor de Problemas Técnicos",
  description: "Base de datos compartida de problemas técnicos",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100`}>
        <div className="flex min-h-screen">
          {/* Menú lateral (escritorio) */}
          <aside className="w-56 bg-gray-900 text-white flex-shrink-0 hidden md:block">
            <div className="p-4 border-b border-gray-700">
              <h1 className="font-bold text-lg">🛠️ Soporte</h1>
            </div>
            <nav className="p-4 space-y-2">
              <Link
                href="/"
                className="block px-3 py-2 rounded hover:bg-gray-700 transition"
              >
                📋 Problemas
              </Link>
              <Link
                href="/incidencias"
                className="block px-3 py-2 rounded hover:bg-gray-700 transition"
              >
                🗂️ Incidencias
              </Link>
              <Link
                href="/personas"
                className="block px-3 py-2 rounded hover:bg-gray-700 transition"
              >
                👥 Personas
              </Link>
            </nav>
          </aside>

          {/* Contenido principal */}
          <main className="flex-1 overflow-x-hidden">
            {/* Menú superior móvil */}
            <div className="md:hidden bg-gray-900 text-white p-3 flex gap-4 flex-wrap">
              <Link href="/" className="hover:underline">📋 Problemas</Link>
              <Link href="/incidencias" className="hover:underline">🗂️ Incidencias</Link>
              <Link href="/personas" className="hover:underline">👥 Personas</Link>
            </div>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
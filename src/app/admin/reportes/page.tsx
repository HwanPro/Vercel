// src/app/admin/reportes/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Home } from "lucide-react";

export default function AdminReportes() {
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);

  // Función para manejar el cierre de sesión
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="px-6 bg-black min-h-screen text-white">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-black relative">
        <Link
          className="flex items-center justify-center no-underline"
          href="/"
        >
          <Home className="h-6 w-6 text-yellow-400 mr-2" />
          <span className="text-yellow-400">Inicio</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/admin/dashboard"
            className="text-sm font-medium text-white hover:text-yellow-400 no-underline"
          >
            Dashboard
          </Link>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="text-sm font-medium text-white hover:text-yellow-400"
          >
            Mi Perfil
          </button>
        </nav>

        {/* Menú de perfil */}
        {profileOpen && (
          <div className="absolute top-14 right-4 bg-white text-black p-4 rounded shadow-lg z-50">
            <p>
              <strong>Email:</strong> {session?.user?.email || "N/A"}
            </p>
            <p>
              <strong>Rol:</strong> {session?.user?.role || "N/A"}
            </p>
            <button
              className="mt-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              onClick={handleSignOut}
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </header>

      <h1 className="text-3xl font-bold mb-6 text-yellow-400">
        Reportes
      </h1>

      {/* Aquí puedes agregar el contenido de los reportes */}
      <p>Sección de reportes en construcción.</p>
    </div>
  );
}

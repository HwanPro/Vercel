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
            className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 w-full md:w-auto text-center"
          >
            Volver al Dashboard
          </Link>
        </nav>

        {/* Menú de perfil */}
      </header>

      <h1 className="text-3xl font-bold mb-6 text-yellow-400">Reportes</h1>

      {/* Aquí puedes agregar el contenido de los reportes */}
      <p>Sección de reportes en construcción.</p>
    </div>
  );
}

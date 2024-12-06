// src/components/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button onClick={() => signOut()} className="logout-button">
      Cerrar Sesión
    </button>
  );
}

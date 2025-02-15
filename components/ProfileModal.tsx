"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  userRole?: string;
  profileImage?: string | null;
}

export default function ProfileModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  userRole,
  profileImage,
}: ProfileModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end items-start z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80 mt-16 mr-4">
        <h3 className="text-xl font-bold mb-4 text-black">Mi Perfil</h3>

        {profileImage && (
          <img
            src={profileImage}
            alt="Foto de perfil"
            className="w-20 h-20 rounded-full mx-auto mb-4"
          />
        )}

        <p className="text-black mb-2">
          <strong>Nombre:</strong> {userName}
        </p>
        <p className="text-black mb-2">
          <strong>Correo:</strong> {userEmail}
        </p>

        {userRole && (
          <p className="text-black mb-2">
            <strong>Rol:</strong> {userRole}
          </p>
        )}

        <button
          onClick={() => {
            onClose();
            router.push("/auth/forgot-password");
          }}
          className="text-yellow-500 underline mt-2"
        >
          Cambiar Contraseña
        </button>

        <button
          className="bg-red-500 text-white w-full p-2 rounded mt-4"
          onClick={() => signOut()}
        >
          Cerrar Sesión
        </button>

        <button
          className="bg-gray-400 text-white w-full p-2 rounded mt-2"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

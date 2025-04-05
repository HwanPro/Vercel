"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { toast } from "react-toastify";
import { Label } from "@/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { Phone, Lock, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { useState } from "react";
import "react-toastify/dist/ReactToastify.css";

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => Promise<void>;

  // Si es un admin editando a otro user, puedes pasar un userId distinto
  targetUserId?: string;

  // Datos a mostrar en el modal
  userName?: string;
  firstName?: string;
  userLastName?: string;
  userPhone?: string;
  userEmergencyPhone?: string;
  userRole?: string;
  profileImage?: string | null;
}

export default function ProfileModal({
  isOpen,
  onClose,
  onSuccess,
  targetUserId,
  userName = "",
  firstName = "",
  userLastName = "",
  userPhone = "",
  userEmergencyPhone = "",
  userRole = "",
  profileImage,
}: ProfileModalProps) {
  const router = useRouter();

  // Estados locales del form
  const [username, setUsername] = useState<string>(userName);
  const [firstNameLocal, setFirstNameLocal] = useState<string>(firstName);
  const [lastName, setLastName] = useState<string>(userLastName);
  const [phone, setPhone] = useState<string>(userPhone);
  const [emergencyPhone, setEmergencyPhone] = useState<string>(userEmergencyPhone);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateFields() {
    if (!username.trim() || !firstNameLocal.trim() || !lastName.trim() || !phone.trim()) {
      toast.error("❌ Faltan campos (usuario, nombre, apellidos, teléfono).");
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validateFields()) return;
    setIsSubmitting(true);

    try {
      // Decidir la ruta:
      // - /api/admin/update-user si eres admin actualizando a otro
      // - /api/user/update si es un user normal
      const endpoint = targetUserId
        ? "/api/admin/update-user"
        : "/api/user/update";

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId, // solo si eres admin
          username: username.trim(),
          firstName: firstNameLocal.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          emergencyPhone: emergencyPhone.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar los datos");
      }

      toast.success("✅ Datos actualizados correctamente 🎉");
      onClose();

      // Recargar la lista o info
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error(error);
      toast.error("❌ Error al actualizar los datos.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-yellow-400 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">Mi Perfil</DialogTitle>
          <DialogDescription>Gestiona tu información personal</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-24 h-24 border-2 border-yellow-400">
              <AvatarImage src={profileImage || "/placeholder.svg"} />
              <AvatarFallback className="bg-yellow-400 text-black text-xl">
                {firstNameLocal.charAt(0).toUpperCase() || "U"}
                {lastName.charAt(0).toUpperCase() || "N"}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              className="absolute bottom-0 right-0 rounded-full bg-yellow-400 text-black hover:bg-yellow-500"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {/* Nombre y rol */}
          <div>
            <h1 className="text-2xl font-bold text-black">
              {firstNameLocal} {lastName}
            </h1>
            <p className="text-gray-500">{userRole || "Usuario"}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="space-y-4 mt-4">
          {/* Nombre de Usuario */}
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de Usuario</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-white"
            />
          </div>

          {/* Nombre real */}
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              value={firstNameLocal}
              onChange={(e) => setFirstNameLocal(e.target.value)}
              className="bg-white"
            />
          </div>

          {/* Apellidos */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellidos</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-white"
            />
          </div>

          {/* Teléfono principal */}
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white"
              />
              <Button size="icon" variant="outline" className="shrink-0">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Teléfono de emergencia */}
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">Teléfono de emergencia</Label>
            <div className="flex gap-2">
              <Input
                id="emergencyPhone"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="bg-white"
              />
              <Button size="icon" variant="outline" className="shrink-0">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Botón guardar */}
          <Button
            className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>

          {/* Cambiar contraseña */}
          <Button
            className="w-full bg-gray-200 text-black hover:bg-gray-300"
            onClick={() => router.push("/auth/reset-password")}
          >
            Cambiar contraseña
            <Lock className="ml-2 h-4 w-4" />
          </Button>

          {/* Cerrar sesión */}
          <Button
            className="w-full bg-red-500 text-white hover:bg-red-600"
            onClick={() => signOut()}
          >
            Cerrar sesión
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

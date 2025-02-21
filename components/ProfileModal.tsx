"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, Lock, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import "react-toastify/dist/ReactToastify.css";

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => Promise<void>; // ✅ onSuccess es opcional
  userName: string;
  userLastName: string;
  userEmail: string;
  userPhone?: string;
  userRole?: string;
  profileImage?: string | null;
}

export default function ProfileModal({
  isOpen,
  onClose,
  onSuccess,
  userName,
  userLastName,
  userEmail,
  userPhone = "", // Valor por defecto si es undefined
  userRole,
  profileImage,
}: ProfileModalProps) {
  const router = useRouter();

  // ✅ Corregido: Ahora usa los valores pasados en los props
  const [firstName, setFirstName] = useState(userName);
  const [lastName, setLastName] = useState(userLastName);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState(userPhone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailEditable, setIsEmailEditable] = useState(false);

  const validateFields = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("❌ Todos los campos son obligatorios.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
        }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Error al actualizar los datos");

      toast.success("✅ Datos actualizados correctamente 🎉");
      onClose();
      if (onSuccess) await onSuccess();
    } catch (error) {
      toast.error("❌ Error al actualizar los datos.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-yellow-400">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">Mi Perfil</DialogTitle>
          <DialogDescription>
            Gestiona tu información personal
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24 border-2 border-yellow-400">
              <AvatarImage src={profileImage || "/placeholder.svg"} />
              <AvatarFallback className="bg-yellow-400 text-black text-xl">
                {firstName?.charAt(0).toUpperCase() || "U"}
                {lastName?.charAt(0).toUpperCase() || "N"}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              className="absolute bottom-0 right-0 rounded-full bg-yellow-400 text-black hover:bg-yellow-500"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">
              {firstName} {lastName}
            </h1>
            <p className="text-gray-500">
              {userRole === "admin" ? "Administrador" : "Usuario"}
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Apellidos</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white"
                disabled={!isEmailEditable}
              />
              <Button
                size="icon"
                variant="outline"
                className="shrink-0"
                onClick={() => setIsEmailEditable(!isEmailEditable)}
              >
                <Mail className="h-4 w-4" />
              </Button>
            </div>
            {!isEmailEditable && (
              <p className="text-sm text-gray-500">
                Haz clic en el ícono para editar el correo.
              </p>
            )}
          </div>

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

          <Button
            className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>

          <Button
            className="w-full bg-gray-200 text-black hover:bg-gray-300"
            onClick={() => router.push("/auth/forgot-password")}
          >
            Cambiar contraseña
            <Lock className="ml-2 h-4 w-4" />
          </Button>

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

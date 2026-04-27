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
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  const { update: updateSession } = useSession();

  // Estados locales del form
  const [username, setUsername] = useState<string>(userName);
  const [firstNameLocal, setFirstNameLocal] = useState<string>(firstName);
  const [lastName, setLastName] = useState<string>(userLastName);
  const [phone, setPhone] = useState<string>(userPhone);
  const [emergencyPhone, setEmergencyPhone] = useState<string>(userEmergencyPhone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentProfileImage, setCurrentProfileImage] = useState<string | null>(profileImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Actualizar la imagen cuando cambie la prop
  useEffect(() => {
    setCurrentProfileImage(profileImage || null);
  }, [profileImage]);

  function validateFields() {
    if (!username.trim() || !firstNameLocal.trim() || !lastName.trim() || !phone.trim()) {
      toast.error("❌ Faltan campos (usuario, nombre, apellidos, teléfono).");
      return false;
    }
    return true;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("❌ Tipo de archivo no permitido. Solo JPG, PNG y WEBP.");
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("❌ El archivo es demasiado grande. Máximo 5MB.");
      return;
    }

    // Mostrar previsualización inmediata
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        console.log("🖼️ Previsualización cargada:", e.target.result);
        setCurrentProfileImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al subir la imagen");
      }

      // Actualizar con la URL real del servidor
      console.log("🖼️ URL de imagen actualizada:", data.imageUrl);
      setCurrentProfileImage(data.imageUrl);
      
      // Actualizar la sesión de NextAuth
      try {
        await updateSession({
          image: data.imageUrl
        });
        console.log("✅ Sesión actualizada con nueva imagen");
      } catch (sessionError) {
        console.error("⚠️ Error actualizando sesión:", sessionError);
        // Continuar aunque falle la actualización de sesión
      }
      
      toast.success("✅ Imagen de perfil actualizada correctamente");
      
      // Recargar la información si hay callback
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Error al subir imagen:", error);
      toast.error("❌ Error al subir la imagen de perfil");
      // Revertir a la imagen anterior en caso de error
      setCurrentProfileImage(profileImage || null);
    } finally {
      setIsUploadingImage(false);
      // Limpiar el input para permitir subir la misma imagen otra vez
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

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
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-yellow-300">Mi Perfil</DialogTitle>
          <DialogDescription className="text-zinc-400">Gestiona tu información personal</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 border-2 border-yellow-400 rounded-full overflow-hidden bg-yellow-400 flex items-center justify-center">
              {currentProfileImage ? (
                <img 
                  src={currentProfileImage} 
                  alt="Imagen de perfil"
                  className="w-full h-full object-cover"
                  onLoad={() => console.log("🖼️ Imagen cargada correctamente")}
                  onError={() => console.log("❌ Error cargando imagen:", currentProfileImage)}
                />
              ) : (
                <div className="bg-yellow-400 text-black text-xl font-bold">
                  {firstNameLocal.charAt(0).toUpperCase() || "U"}
                  {lastName.charAt(0).toUpperCase() || "N"}
                </div>
              )}
            </div>
            <Button
              size="icon"
              className="absolute bottom-0 right-0 rounded-full bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-50"
              onClick={handleCameraClick}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Nombre y rol */}
          <div>
            <h1 className="text-2xl font-bold text-white">
              {firstNameLocal} {lastName}
            </h1>
            <p className="text-zinc-400">{userRole || "Usuario"}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="space-y-4 mt-4">
          {/* Nombre de Usuario */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-zinc-200">Nombre de Usuario</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border border-zinc-700 bg-black text-white"
            />
          </div>

          {/* Nombre real */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-zinc-200">Nombre</Label>
            <Input
              id="firstName"
              value={firstNameLocal}
              onChange={(e) => setFirstNameLocal(e.target.value)}
              className="border border-zinc-700 bg-black text-white"
            />
          </div>

          {/* Apellidos */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-zinc-200">Apellidos</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border border-zinc-700 bg-black text-white"
            />
          </div>

          {/* Teléfono principal */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-zinc-200">Teléfono</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border border-zinc-700 bg-black text-white"
              />
              <Button size="icon" variant="outline" className="shrink-0 !border-zinc-700 !bg-zinc-900 !text-yellow-300 hover:!bg-zinc-800">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Teléfono de emergencia */}
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone" className="text-zinc-200">Teléfono de emergencia</Label>
            <div className="flex gap-2">
              <Input
                id="emergencyPhone"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="border border-zinc-700 bg-black text-white"
              />
              <Button size="icon" variant="outline" className="shrink-0 !border-zinc-700 !bg-zinc-900 !text-yellow-300 hover:!bg-zinc-800">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Botón guardar */}
          <Button
            className="w-full bg-yellow-400 font-semibold text-black hover:bg-yellow-300"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>

          {/* Cambiar contraseña - DESACTIVADO */}
          <Button
            className="w-full cursor-not-allowed bg-zinc-800 text-zinc-400"
            disabled
          >
            Cambiar contraseña (Próximamente)
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

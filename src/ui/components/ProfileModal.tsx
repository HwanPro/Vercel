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
import { Phone, Lock, Camera, IdCard } from "lucide-react";
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
  userDocumentNumber?: string;
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
  userDocumentNumber = "",
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
  const [documentNumber, setDocumentNumber] = useState<string>(userDocumentNumber);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentProfileImage, setCurrentProfileImage] = useState<string | null>(profileImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Actualizar la imagen cuando cambie la prop
  useEffect(() => {
    setCurrentProfileImage(profileImage || null);
  }, [profileImage]);

  useEffect(() => {
    setUsername(userName || "");
    setFirstNameLocal(firstName || "");
    setLastName(userLastName || "");
    setPhone(userPhone || "");
    setEmergencyPhone(userEmergencyPhone || "");
    setDocumentNumber(userDocumentNumber || "");
  }, [firstName, userDocumentNumber, userEmergencyPhone, userLastName, userName, userPhone]);

  function validateFields() {
    if (!username.trim() || !firstNameLocal.trim() || !lastName.trim() || !phone.trim()) {
      toast.error("❌ Faltan campos (usuario, nombre, apellidos, teléfono).");
      return false;
    }
    const dni = documentNumber.replace(/\D/g, "");
    if (dni && dni.length !== 8) {
      toast.error("❌ El DNI debe tener 8 dígitos.");
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
          documentNumber: documentNumber.replace(/\D/g, "").slice(0, 8),
          dni: documentNumber.replace(/\D/g, "").slice(0, 8),
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
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto border border-wolf-border bg-white text-wolf-ink shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-wolf-ink">Editar perfil</DialogTitle>
          <DialogDescription className="text-wolf-subtle">
            Gestiona tu información personal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 border-2 border-wolf-primary rounded-full overflow-hidden bg-wolf-primary flex items-center justify-center">
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
              className="absolute bottom-0 right-0 rounded-full bg-wolf-primary text-wolf-ink hover:bg-yellow-300 disabled:opacity-50"
              onClick={handleCameraClick}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-wolf-ink"></div>
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
            <h1 className="text-2xl font-bold text-wolf-ink">
              {firstNameLocal} {lastName}
            </h1>
            <p className="text-wolf-subtle">{userRole || "Usuario"}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="space-y-4 mt-4">
          {/* Nombre de Usuario */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-wolf-ink">Usuario</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border border-wolf-border bg-white text-wolf-ink"
            />
          </div>

          {/* Nombre real */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-wolf-ink">Nombre</Label>
            <Input
              id="firstName"
              value={firstNameLocal}
              onChange={(e) => setFirstNameLocal(e.target.value)}
              className="border border-wolf-border bg-white text-wolf-ink"
            />
          </div>

          {/* Apellidos */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-wolf-ink">Apellidos</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border border-wolf-border bg-white text-wolf-ink"
            />
          </div>

          {/* Teléfono principal */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-wolf-ink">Teléfono</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border border-wolf-border bg-white text-wolf-ink"
              />
              <Button size="icon" variant="outline" className="shrink-0 !border-wolf-border !bg-white !text-wolf-primary-strong hover:!bg-wolf-muted">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Teléfono de emergencia */}
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone" className="text-wolf-ink">Teléfono de emergencia</Label>
            <div className="flex gap-2">
              <Input
                id="emergencyPhone"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="border border-wolf-border bg-white text-wolf-ink"
              />
              <Button size="icon" variant="outline" className="shrink-0 !border-wolf-border !bg-white !text-wolf-primary-strong hover:!bg-wolf-muted">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* DNI */}
          <div className="space-y-2">
            <Label htmlFor="documentNumber" className="text-wolf-ink">DNI</Label>
            <div className="flex gap-2">
              <Input
                id="documentNumber"
                value={documentNumber}
                onChange={(e) =>
                  setDocumentNumber(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                placeholder="8 dígitos"
                className="border border-wolf-border bg-white text-wolf-ink"
              />
              <Button size="icon" variant="outline" className="shrink-0 !border-wolf-border !bg-white !text-wolf-primary-strong hover:!bg-wolf-muted">
                <IdCard className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Botón guardar */}
          <Button
            className="w-full bg-wolf-primary font-semibold text-wolf-ink hover:bg-yellow-300"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>

          {/* Cambiar contraseña - DESACTIVADO */}
          <Button
            className="w-full cursor-not-allowed bg-slate-100 text-wolf-subtle"
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

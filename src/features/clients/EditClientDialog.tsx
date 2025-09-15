"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/ui/dialog";
import { Button } from "@/ui/button";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MembershipSelection from "@/ui/components/MembershipSelection";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Image from "next/image";

interface Client {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  plan: string;
  membershipStart: string;
  membershipEnd: string;
  phone: string;
  emergencyPhone: string;
  address?: string;
  social?: string;
  hasPaid: boolean;
  password?: string;
  debt?: number;
  image?: string;
}

interface EditClientDialogProps {
  client: Client;
  onUpdate: (updatedClient: Client) => Promise<void>;
}

export default function EditClientDialog({
  client,
  onUpdate,
}: EditClientDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Client>(client);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(client.image || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(client);
  }, [client]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'users');
    
    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Error uploading image');
    }
    
    const data = await response.json();
    return data.fileUrl;
  };

  const formatDateToISO = (date: string) => {
    if (!date) return "";
    const parsedDate = new Date(date);
    return parsedDate.toISOString().split("T")[0];
  };

  const handleSave = async () => {
    try {
      setUploading(true);
      
      // Validate phone numbers
      if (formData.phone && !isValidPhoneNumber(formData.phone)) {
        toast.error('El número de teléfono principal no es válido.');
        return;
      }
      if (formData.emergencyPhone && !isValidPhoneNumber(formData.emergencyPhone)) {
        toast.error('El número de emergencia no es válido.');
        return;
      }
      
      let imageUrl = formData.image;
      
      // Upload image if a new one was selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        plan: formData.plan,
        startDate: formatDateToISO(formData.membershipStart),
        endDate: formatDateToISO(formData.membershipEnd),
        phone: formData.phone || "",
        emergencyPhone: formData.emergencyPhone || "",
        address: formData.address || "",
        social: formData.social || "",
        image: imageUrl,
      };

      const response = await fetch(`/api/clients/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al actualizar el cliente");
      }

      await onUpdate({ ...formData, image: imageUrl });
      setIsOpen(false);
      toast.success('Cliente actualizado exitosamente');
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el cliente.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
          Editar
        </Button>
      </DialogTrigger>

      {/*
        w-full          -> Usa todo el ancho disponible en pantallas pequeñas
        max-w-md        -> Limita el ancho en pantallas más grandes (puedes usar sm:max-w-xl si deseas)
        mx-auto         -> Centra horizontalmente
        overflow-hidden -> Evita scroll por hover:scale-105 o contenido que se salga
      */}
      <DialogContent className="bg-white p-6 rounded-lg w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-lg font-bold text-black">
          Editar Cliente
        </DialogTitle>

        <div className="space-y-4 mt-4">
          {/* Profile Image */}
          <div>
            <label className="text-gray-600 text-sm">Foto de Perfil</label>
            <div className="flex items-center space-x-4">
              {imagePreview && (
                <Image
                  src={imagePreview}
                  alt="Profile preview"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="text-sm"
                >
                  {imagePreview ? 'Cambiar Foto' : 'Subir Foto'}
                </Button>
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="text-gray-600 text-sm">Nombre</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="border p-2 w-full"
            />
          </div>

          {/* Apellidos */}
          <div>
            <label className="text-gray-600 text-sm">Apellidos</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="border p-2 w-full"
            />
          </div>

          {/* Correo (solo lectura) */}
          <div>
            <label className="text-gray-600 text-sm">
              Correo (solo lectura)
            </label>
            <input
              id="email"
              value={formData.email}
              readOnly
              className="border p-2 w-full bg-gray-200 cursor-not-allowed"
            />
          </div>

          {/* Teléfono Principal */}
          <div>
            <label className="text-gray-600 text-sm">Teléfono</label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => setFormData(prev => ({ ...prev, phone: value || '' }))}
              defaultCountry="PE"
              className="border p-2 w-full"
            />
          </div>

          {/* Teléfono de Emergencia */}
          <div>
            <label className="text-gray-600 text-sm">
              Teléfono de Emergencia
            </label>
            <PhoneInput
              value={formData.emergencyPhone}
              onChange={(value) => setFormData(prev => ({ ...prev, emergencyPhone: value || '' }))}
              defaultCountry="PE"
              className="border p-2 w-full"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="text-gray-600 text-sm">
              Dirección (opcional)
            </label>
            <input
              type="text"
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              className="border p-2 w-full"
            />
          </div>

          {/* Red Social */}
          <div>
            <label className="text-gray-600 text-sm">
              Red social (opcional)
            </label>
            <input
              type="text"
              name="social"
              value={formData.social || ""}
              onChange={handleChange}
              className="border p-2 w-full"
            />
          </div>

          {/* Plan */}
          <div>
            <label className="text-gray-600 text-sm">Plan</label>
            {/*
              Asegúrate de que el componente MembershipSelection también
              use un contenedor con grid responsivo y overflow-hidden.
            */}
            <MembershipSelection
              onPlanSelect={(selectedPlan, startDate, endDate) => {
                setFormData((prev) => ({
                  ...prev,
                  plan: selectedPlan,
                  membershipStart: startDate,
                  membershipEnd: endDate,
                }));
              }}
            />
          </div>

          {/* Fechas de Membresía */}
          <div>
            <label className="text-gray-600 text-sm">Fecha de Inicio</label>
            <input
              type="date"
              name="membershipStart"
              value={formData.membershipStart}
              onChange={handleChange}
              className="border p-2 w-full"
            />
          </div>

          <div>
            <label className="text-gray-600 text-sm">Fecha de Fin</label>
            <input
              type="date"
              name="membershipEnd"
              value={formData.membershipEnd}
              onChange={handleChange}
              className="border p-2 w-full"
            />
          </div>
        </div>

        {/*
          Botones: se pueden apilar en móviles y colocarse en fila en pantallas mayores.
          "flex flex-col sm:flex-row" + "gap-2" te dará ese comportamiento.
        */}
        <div className="flex flex-col sm:flex-row justify-between mt-6 gap-2">
          <Button onClick={() => setIsOpen(false)} variant="outline">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={uploading}
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            {uploading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

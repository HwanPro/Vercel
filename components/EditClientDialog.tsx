"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  plan: string;
  membershipStart: string;
  membershipEnd: string;
  phone: string;
  emergencyPhone: string;
}

interface EditClientDialogProps {
  client: Client;
  onUpdate: (updatedClient: Client) => void;
}

export default function EditClientDialog({
  client,
  onUpdate,
}: EditClientDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Client>(client);

  const planOptions = ["Mensual", "Básico", "Pro", "Elite"];

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
  /**
   * Llama al endpoint de actualización de cliente (PUT /api/clients/[id])
   * para modificar tanto la tabla `User` (nombres, apellidos) como
   * la tabla `ClientProfile` (plan, fechas, teléfonos).
   */

  const formatDateToISO = (date: string) => {
    if (!date) return "";
    const parsedDate = new Date(date);
    return parsedDate.toISOString().split("T")[0]; // yyyy-MM-dd
  };

  const handleSave = async () => {
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        plan: formData.plan,
        startDate: formatDateToISO(formData.membershipStart),
        endDate: formatDateToISO(formData.membershipEnd),
        phone: formData.phone || "",
        emergencyPhone: formData.emergencyPhone || "",
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

      toast.success("Cliente actualizado con éxito!");
      onUpdate({ ...formData });
      setIsOpen(false);
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
      toast.error("No se pudo actualizar el cliente.");
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
          Editar
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-white p-6 rounded-lg max-w-xl">
        <DialogTitle className="text-lg font-bold text-black">
          Editar Cliente
        </DialogTitle>

        <div className="space-y-4 mt-4">
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

          {/* Correo (bloqueado) */}
          <div>
            <label className="text-gray-600 text-sm">
              Correo (solo lectura)
            </label>
            <input
              id="email"
              value={formData.email} // <-- usar la propiedad real
              readOnly
              className="border p-2 w-full bg-gray-200 cursor-not-allowed"
            />
          </div>

          {/* Teléfono Principal */}
          <div>
            <label className="text-gray-600 text-sm">Teléfono</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="border p-2 w-full"
            />
          </div>

          {/* Teléfono de Emergencia */}
          <div>
            <label className="text-gray-600 text-sm">
              Teléfono de Emergencia
            </label>
            <input
              type="text"
              name="emergencyPhone"
              value={formData.emergencyPhone}
              onChange={handleChange}
              className="border p-2 w-full"
            />
          </div>

          {/* Plan */}
          <div>
            <label className="text-gray-600 text-sm">Plan</label>
            <select
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              className="border p-2 w-full"
            >
              {planOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
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

        {/* Botones de acción */}
        <div className="flex justify-between mt-6">
          {/* Botón para cambiar contraseña */}
          <div className="flex gap-2">
            <Button onClick={() => setIsOpen(false)} variant="outline">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

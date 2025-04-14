"use client";

import { useState } from "react";
import { Button } from "@/ui/button";

type Plan = {
  id: string;
  name: string;
  price: number;
  description: string;
  amountCents: number;
};

interface EditPlanFormProps {
  plan: Plan;
  onClose: () => void;
  // Podrías recibir una función onSave para actualizar la lista de planes, por ejemplo.
}

export default function EditPlanForm({ plan, onClose }: EditPlanFormProps) {
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(plan.price);
  const [description, setDescription] = useState(plan.description);

  const handleSave = async () => {
    // Llama a la API o actualiza el plan según tu lógica.
    try {
      // Ejemplo: actualiza vía fetch a /api/plans/[id]
      const resp = await fetch(`/api/plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, description }),
      });
      if (!resp.ok) throw new Error("Error al actualizar el plan");
      alert("Plan actualizado con éxito");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el plan");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold mb-1">Nombre</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-bold mb-1">Precio</label>
        <input
          type="number"
          className="w-full p-2 border rounded"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      </div>
      <div>
        <label className="block text-sm font-bold mb-1">Descripción</label>
        <textarea
          className="w-full p-2 border rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2 ">
        <Button onClick={handleSave} className="">Guardar</Button>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

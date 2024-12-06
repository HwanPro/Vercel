// components/EditProductDialog.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Product = {
  item_id: string;
  item_name: string;
  item_description: string;
  item_price: number;
  item_discount: number;
  item_stock: number;
  item_image_url: string;
};

type EditProductDialogProps = {
  product: Product;
  onSave: (updatedProduct: Product) => void;
  onClose: () => void;
};

export default function EditProductDialog({
  product,
  onSave,
  onClose,
}: EditProductDialogProps) {
  const [editedProduct, setEditedProduct] = useState<Product>({ ...product });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedProduct((prev) => ({
      ...prev,
      [name]:
        name === "item_price" ||
        name === "item_discount" ||
        name === "item_stock"
          ? parseFloat(value)
          : value,
    }));
  };

  const handleSave = () => {
    onSave(editedProduct);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4 text-black">Editar Producto</h2>
      <div className="grid grid-cols-1 gap-4 text-black">
        <div>
          <label className="block text-sm font-bold text-black">Nombre</label>
          <input
            type="text"
            name="item_name"
            value={editedProduct.item_name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-black">
            Descripción
          </label>
          <textarea
            name="item_description"
            value={editedProduct.item_description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-black">Precio</label>
          <input
            type="number"
            name="item_price"
            value={editedProduct.item_price}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-black">
            Descuento (%) - Opcional
          </label>
          <input
            type="number"
            name="item_discount"
            value={editedProduct.item_discount || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-black">Stock</label>
          <input
            type="number"
            name="item_stock"
            value={editedProduct.item_stock}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white text-black"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-4">
        <Button
          onClick={onClose}
          className="bg-gray-300 text-black hover:bg-gray-400"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          className="bg-yellow-400 text-black hover:bg-yellow-500"
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}

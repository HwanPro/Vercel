// components/AddProductDialog.tsx

import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button } from "@/components/ui/button";

function AddProductDialog({
  onSave,
}: {
  onSave: (product: { name: string; price: number; description: string; stock: number; discount?: number; imageUrl: string }) => void; // Definición clara del tipo
}) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");
  const [stock, setStock] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);

  const handleAddProduct = async () => {
    if (!name || !description || !price || !stock || !image) {
      toast.error("Por favor, completa todos los campos requeridos.");
      return;
    }

    const formData = new FormData();
    formData.append("item_name", name);
    formData.append("item_description", description);
    formData.append("item_price", price);
    formData.append("item_discount", discount || "0");
    formData.append("item_stock", stock);
    formData.append("file", image);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onSave({
          name: data.product.item_name,
          price: data.product.item_price,
          description: data.product.item_description,
          stock: data.product.item_stock,
          discount: data.product.item_discount,
          imageUrl: data.product.imageUrl,
        });
        toast.success("Producto agregado exitosamente!");
        setName("");
        setDescription("");
        setPrice("");
        setDiscount("");
        setStock("");
        setImage(null);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Error al agregar el producto");
      }
    } catch (error) {
      console.error("Error en el servidor:", error);
      toast.error("Error en el servidor");
    }
  };

  return (
    <div>
      <ToastContainer />
      <div className="p-6 bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
        <input
          type="text"
          placeholder="Nombre del producto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 mb-4 border rounded bg-white text-black"
        />
        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 mb-4 border rounded bg-white text-black"
        />
        <input
          type="number"
          placeholder="Precio"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-2 mb-4 border rounded bg-white text-black"
        />
        <input
          type="number"
          placeholder="Descuento (%) - Opcional"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          className="w-full p-2 mb-4 border rounded bg-white text-black"
        />
        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-full p-2 mb-4 border rounded bg-white text-black"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
          className="w-full p-2 mb-4 border rounded bg-white text-black"
        />
        <Button
          className="w-full bg-yellow-400 text-black py-2 rounded hover:bg-yellow-500"
          onClick={handleAddProduct}
        >
          Guardar Producto
        </Button>
      </div>
    </div>
  );
}

export default AddProductDialog;

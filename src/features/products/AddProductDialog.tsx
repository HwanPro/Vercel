import { useState } from "react";
import { Button } from "@/ui/button";
import { toast } from "react-toastify";

type NewProduct = {
  name: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  imageUrl: string;
};

function AddProductDialog({
  onSave,
  onClose,
}: {
  onSave: (product: NewProduct) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");
  const [stock, setStock] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);

  const handleAddProduct = async () => {
    if (!name || !description || !price || !stock || !image) {
      toast.error("Todos los campos son obligatorios", {
        position: "top-center",
      });
      return;
    }

    if (parseFloat(price) <= 0 || parseInt(stock) < 0) {
      toast.error(
        "El precio debe ser mayor a 0 y el stock no puede ser negativo",
        { position: "top-center" }
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("item_name", name);
      formData.append("item_description", description);
      formData.append("item_price", price);
      formData.append("item_discount", discount || "0");
      formData.append("item_stock", stock);
      formData.append("file", image);

      const response = await fetch("/api/products", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error al crear el producto:", errorText);
        toast.error("Error al crear el producto", { position: "top-center" });
        return;
      }

      const data = await response.json();

      onSave({
        name: data.product.item_name,
        description: data.product.item_description,
        price: data.product.item_price,
        discount: data.product.item_discount,
        stock: data.product.item_stock,
        imageUrl: data.product.item_image_url,
      });

      resetForm();
      onClose();
      toast.success("Producto agregado con éxito", { position: "top-right" });
    } catch (error) {
      console.error("Error en el proceso de subida:", error);
      toast.error("Error inesperado", { position: "top-center" });
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setDiscount("");
    setStock("");
    setImage(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md relative">
        <h2 className="text-lg font-bold text-center text-black mb-4">
          Agregar Producto
        </h2>

        <input
          type="text"
          placeholder="Nombre del producto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 mb-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 mb-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <input
          type="number"
          placeholder="Precio"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-2 mb-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <input
          type="number"
          placeholder="Descuento (%) - Opcional"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          className="w-full p-2 mb-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-full p-2 mb-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
          className="w-full p-2 mb-4 border rounded text-sm focus:outline-none"
        />

        <Button
          className="w-full bg-yellow-400 text-black py-2 text-sm rounded-lg hover:bg-yellow-500"
          onClick={handleAddProduct}
        >
          Guardar Producto
        </Button>

        <button
          className="absolute top-2 right-3 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default AddProductDialog;

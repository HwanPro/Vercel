import { useState } from "react";
import { Button } from "@/components/ui/button";
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

    try {
      // 1. Crear FormData con los campos del producto
      const formData = new FormData();
      formData.append("item_name", name);
      formData.append("item_description", description);
      formData.append("item_price", price);
      formData.append("item_discount", discount || "0"); // Opcional
      formData.append("item_stock", stock);
      formData.append("file", image); // Imagen seleccionada

      // 2. Enviar solicitud POST al backend
      const response = await fetch("/api/products", {
        method: "POST",
        credentials: "include", // Incluye las cookies en la solicitud
        body: formData, // Enviar FormData directamente
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error al crear el producto:", errorText);
        toast.error("Error al crear el producto", { position: "top-center" });
        return;
      }

      const data = await response.json();

      // 3. Actualizar estado del producto
      onSave({
        name: data.product.item_name,
        description: data.product.item_description,
        price: data.product.item_price,
        discount: data.product.item_discount,
        stock: data.product.item_stock,
        imageUrl: data.product.item_image_url,
      });

      // 4. Reiniciar formulario y cerrar modal
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
    <div>
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

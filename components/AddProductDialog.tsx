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
        style: { backgroundColor: "#FF0000", color: "#FFF" },
      });
      return;
    }

    try {
      // Subir la imagen
      const formData = new FormData();
      formData.append("file", image);

      const uploadRes = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error("Error al subir la imagen:", errorText);
        toast.error("Error al subir la imagen", { position: "top-center" });
        return;
      }

      const { fileUrl } = await uploadRes.json();

      // Crear el producto
      const productRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: name,
          item_description: description,
          item_price: price,
          item_discount: discount || "0",
          item_stock: stock,
          item_image_url: fileUrl,
        }),
      });

      if (!productRes.ok) {
        const errorText = await productRes.text();
        console.error("Error al crear el producto:", errorText);
        toast.error("Error al crear el producto", { position: "top-center" });
        return;
      }

      const data = await productRes.json();
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
      toast.error("Error en el proceso de subida", { position: "top-center" });
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

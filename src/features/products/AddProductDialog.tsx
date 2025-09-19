import { useState } from "react";
import { Button } from "@/ui/button";
import { toast } from "react-toastify";
import { DialogClose } from "@radix-ui/react-dialog";

type NewProduct = {
  name: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  imageUrl: string;
  isGymProduct: boolean;
  category: string;
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
  const [isGymProduct, setIsGymProduct] = useState<boolean>(false);
  const [category, setCategory] = useState<string>("");

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
      formData.append("isGymProduct", isGymProduct.toString());
      formData.append("category", category);
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
        isGymProduct: data.product.is_admin_only || false,
        category: data.product.item_category || "",
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
    setIsGymProduct(false);
    setCategory("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg relative border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Agregar Producto</h2>
          <DialogClose asChild>
  <button
    type="button"
    className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
  >
    ×
  </button>
</DialogClose>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del producto *
            </label>
            <input
              type="text"
              placeholder="Ej: Proteína Whey"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              placeholder="Describe el producto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio (S/) *
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descuento (%)
              </label>
              <input
                type="number"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock *
            </label>
            <input
              type="number"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen del producto *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
            />
          </div>

          {/* Checkbox para producto de gimnasio */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isGymProduct"
              checked={isGymProduct}
              onChange={(e) => setIsGymProduct(e.target.checked)}
              className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300 rounded"
            />
            <label htmlFor="isGymProduct" className="ml-3 text-sm font-medium text-gray-700">
              Solo para gimnasio (no se mostrará al público)
            </label>
          </div>

          {/* Campo de categoría */}
          {isGymProduct && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="">Seleccionar categoría</option>
                <option value="agua">💧 Agua</option>
                <option value="proteina">🥤 Proteína</option>
                <option value="pre-entreno">⚡ Pre-entreno</option>
                <option value="suplementos">💊 Suplementos</option>
                <option value="snacks">🍿 Snacks</option>
                <option value="otros">📦 Otros</option>
              </select>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          <Button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-3 text-sm rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-yellow-400 text-black py-3 text-sm rounded-lg hover:bg-yellow-500 font-medium shadow-md"
            onClick={handleAddProduct}
          >
            Guardar Producto
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AddProductDialog;

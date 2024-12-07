import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  imageUrl: string;
};

function EditProductDialog({
  product,
  onSave,
  onClose,
}: {
  product: Product;
  onSave: (updatedProduct: Product) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(product.price.toString());
  const [discount, setDiscount] = useState(product.discount.toString());
  const [stock, setStock] = useState(product.stock.toString());
  const [error, setError] = useState<string | null>(null);

  // Actualiza los estados cuando el `product` cambie
  useEffect(() => {
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setDiscount(product.discount.toString());
    setStock(product.stock.toString());
  }, [product]);

  const handleSave = () => {
    // Validación de datos
    if (!name.trim() || !description.trim()) {
      setError("El nombre y la descripción son obligatorios.");
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedDiscount = parseFloat(discount);
    const parsedStock = parseInt(stock, 10);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("El precio debe ser un número válido y mayor o igual a 0.");
      return;
    }

    if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
      setError("El descuento debe ser un número entre 0 y 100.");
      return;
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      setError("El stock debe ser un número válido y mayor o igual a 0.");
      return;
    }

    // Si pasa las validaciones, limpia el error y guarda
    setError(null);
    const updatedProduct: Product = {
      ...product,
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      discount: parsedDiscount,
      stock: parsedStock,
    };

    onSave(updatedProduct);
    onClose();
  };

  return (
    <div>
      <div className="p-6 bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
        <h2 className="text-lg font-bold text-center text-black mb-4">
          Editar Producto
        </h2>
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del producto"
          className="w-full p-2 mb-4 border rounded bg-white text-black"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción del producto"
          className="w-full p-2 mb-4 border rounded bg-white text-black"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Precio"
          className="w-full p-2 mb-4 border rounded bg-white text-black"
        />
        <input
          type="number"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          placeholder="Descuento (%)"
          className="w-full p-2 mb-4 border rounded bg-white text-black"
        />
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="Stock"
          className="w-full p-2 mb-4 border rounded bg-white text-black"
        />
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            className="bg-yellow-400 text-black py-2 rounded hover:bg-yellow-500 w-full"
          >
            Guardar Cambios
          </Button>
          <Button
            onClick={onClose}
            className="bg-red-500 text-white py-2 rounded hover:bg-red-600 w-full"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EditProductDialog;

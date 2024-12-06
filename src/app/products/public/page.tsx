"use client";

import { useState, useEffect, useRef } from "react";
import { FaShoppingCart, FaUserCircle, FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  stock: number;
  imageUrl: string;
  quantity?: number;
};

export default function PublicProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products/public");
        if (!response.ok) {
          const errorDetails = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          console.error("API Error Details:", errorDetails);
          throw new Error(errorDetails.error || "Error al cargar datos");
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Unexpected API response format");
        }

        // Mapear los datos correctamente
        const formattedProducts = data.map((product: any) => ({
          id: product.item_id,
          name: product.item_name,
          description: product.item_description,
          price: product.item_price,
          discount: product.item_discount,
          stock: product.item_stock,
          imageUrl: product.item_image_url || "/placeholder-image.png",
        }));

        setProducts(formattedProducts);
        setFilteredProducts(formattedProducts);
      } catch (error: any) {
        console.error("Error fetching products:", error.message);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const results = products.filter((product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  const handleAddToCart = (product: Product) => {
    if (quantity > product.stock) {
      alert("No hay suficiente stock disponible para agregar esta cantidad.");
      return;
    }

    const existingProduct = cart.find((item) => item.id === product.id);
    if (existingProduct) {
      const newQuantity = (existingProduct.quantity || 1) + quantity;
      if (newQuantity > product.stock) {
        alert("No puedes agregar más productos de los que hay en stock.");
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        )
      );
    } else {
      setCart((prev) => [...prev, { ...product, quantity }]);
    }

    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((product) => product.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce(
      (total, product) =>
        total +
        product.price *
          (1 - (product.discount || 0) / 100) *
          (product.quantity || 1),
      0
    );
  };

  const pagarCompra = async () => {
    try {
      // Simulación de la compra y actualización del stock
      for (const item of cart) {
        await fetch(`/api/products/updateStock`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: item.id,
            quantity: item.quantity,
          }),
        });
      }

      alert("Compra realizada con éxito");
      setCart([]);
      setShowCart(false);
    } catch (error) {
      alert("Error al procesar la compra");
      console.error("Error:", error);
    }
  };

  return (
    <div className="bg-white min-h-screen mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white shadow-md">
        <h1 className="text-xl font-bold text-black">Nuestros Productos</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-yellow-400 text-black px-4 py-2 rounded-full hover:bg-yellow-500"
          >
            Volver al Inicio
          </button>
          <FaUserCircle className="text-2xl text-black cursor-pointer" />
          <button
            role="button"
            aria-label="Abrir carrito"
            className="relative text-2xl text-black cursor-pointer focus:outline-none"
            onClick={() => setShowCart(!showCart)}
          >
            <FaShoppingCart />
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 bg-yellow-400 text-black text-xs font-bold rounded-full px-2 py-1">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-6 p-6 mx-auto">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="relative bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center transition-transform transform hover:scale-105"
          >
            {product.discount && (
              <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs px-2 py-1 font-bold rounded">
                {product.discount}% OFF
              </div>
            )}
            {product.stock === 0 && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 font-bold rounded">
                Agotado
              </div>
            )}
            <Image
              src={product.imageUrl || "/placeholder-image.png"}
              alt={product.name}
              className="h-32 w-32 object-contain mx-auto mb-4"
              width={128}
              height={128}
            />
            <h2 className="text-lg font-bold text-black">{product.name}</h2>
            <p className="text-sm text-black">{product.description}</p>
            <p className="text-yellow-400 font-bold">
              S/.{" "}
              {(
                product.price -
                (product.price * (product.discount || 0)) / 100
              ).toFixed(2)}
            </p>
            {product.stock > 0 ? (
              <button
                onClick={() => setSelectedProduct(product)}
                className="mt-4 bg-yellow-400 text-black px-4 py-2 rounded-full hover:bg-yellow-500"
              >
                Seleccionar Opciones
              </button>
            ) : (
              <button
                disabled
                className="mt-4 bg-gray-400 text-black px-4 py-2 rounded-full cursor-not-allowed"
              >
                Agotado
              </button>
            )}

            {/* Modal de Opciones de Producto */}
            {selectedProduct?.id === product.id && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col justify-center items-center rounded-lg shadow-lg text-black">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-2 right-2 text-black font-bold"
                >
                  X
                </button>
                <p className="text-sm text-black mb-2">Cantidad:</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2 py-1 border rounded"
                  >
                    -
                  </button>
                  <span>{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2 py-1 border rounded"
                  >
                    +
                  </button>
                </div>
                <Button
                  className="mt-4 bg-yellow-400 text-black px-4 py-2 rounded-full hover:bg-yellow-500"
                  onClick={() => handleAddToCart(product)}
                >
                  Agregar al carrito
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cart */}
      {showCart && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowCart(false)}
        >
          <div
            className="fixed right-0 top-0 w-80 bg-white h-full shadow-lg p-4 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowCart(false)}
            >
              X
            </button>
            <h2 className="text-lg font-bold mb-4 text-black">Carrito</h2>
            {cart.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center mb-2"
              >
                <Image
                  src={item.imageUrl || "/placeholder-image.png"}
                  alt={item.name}
                  className="h-12 w-12 object-contain"
                  width={48}
                  height={48}
                />
                <div className="flex-1 ml-4">
                  <p className="text-sm font-bold text-black">{item.name}</p>
                  <p className="text-xs text-black">
                    S/.{" "}
                    {(
                      item.price -
                      (item.price * (item.discount || 0)) / 100
                    ).toFixed(2)}{" "}
                    x {item.quantity}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveFromCart(item.id)}
                  className="text-red-500 text-lg font-bold"
                >
                  X
                </button>
              </div>
            ))}
            <div className="border-t pt-4">
              <p className="text-lg font-bold text-black">
                Total: S/. {calculateTotal().toFixed(2)}
              </p>
              <Button
                className="mt-4 bg-yellow-400 text-black px-4 py-2 w-full rounded-full hover:bg-yellow-500"
                onClick={pagarCompra}
              >
                Pagar Carrito
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

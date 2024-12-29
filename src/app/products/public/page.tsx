"use client";

import { useState, useEffect } from "react";
import { FaShoppingCart, FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

declare global {
  interface Window {
    Culqi?: any;
  }
}

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
  const [culqiErrorShown, setCulqiErrorShown] = useState(false); // Controlar si se mostró el error de Culqi
  const router = useRouter();

  // useEffect para cargar productos desde la API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products/public");
        if (!response.ok) {
          throw new Error("Error al cargar productos");
        }

        const data = await response.json();
        const formattedProducts = data.map((product: any) => ({
          id: product.item_id,
          name: product.item_name,
          description: product.item_description,
          price: product.item_price,
          discount: product.item_discount || 0,
          stock: product.item_stock || 0,
          imageUrl: product.item_image_url || "/placeholder-image.png",
        }));

        setProducts(formattedProducts);
        setFilteredProducts(formattedProducts);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        toast.error("❌ Error al cargar productos. Intenta nuevamente.");
      }
    };

    fetchProducts();
  }, []);

  // useEffect para filtrar productos
  useEffect(() => {
    const results = products.filter((product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  const handleAddToCart = (product: Product) => {
    if (quantity > product.stock) {
      toast.warn("⚠️ No hay suficiente stock disponible.");
      return;
    }

    const existingProduct = cart.find((item) => item.id === product.id);
    if (existingProduct) {
      const newQuantity = (existingProduct.quantity || 1) + quantity;
      if (newQuantity > product.stock) {
        toast.warn(
          "⚠️ No puedes agregar más productos de los que hay en stock."
        );
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
    toast.info("🗑 Producto eliminado del carrito.");
  };

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const pagarCompra = async () => {
    if (cart.length === 0) {
      toast.error("🛒 El carrito está vacío. Agrega productos antes de pagar.");
      return;
    }

    const amount =
      cart.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0) *
      100;

    console.log("Monto total a pagar (en céntimos):", amount);

    if (!window.Culqi) {
      if (!culqiErrorShown) {
        setCulqiErrorShown(true);
        toast.error("⚠️ Error al cargar Culqi. Intenta nuevamente.");
        console.log("Error: Culqi no está definido en el objeto `window`.");
      }
      return;
    }

    setIsProcessingPayment(true);

    window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY!;
    window.Culqi.settings({
      title: "Tienda Online",
      currency: "PEN",
      description: "Compra en línea",
      amount,
    });
    window.Culqi.open();
    

    console.log("Configuración de Culqi completada.");

    window.Culqi.open();

    window.Culqi.token = async (token: any) => {
      console.log("Token recibido de Culqi:", token);

      try {
        const response = await axios.post("/api/payments/culqi", {
          token: token.id,
          amount,
          description: "Compra en línea",
          email: "cliente@example.com", // Asegúrate de enviar un correo válido
        });

        console.log("Respuesta de la API Culqi:", response.data);

        if (response.status === 200) {
          toast.success("✅ Pago realizado con éxito");
          setCart([]);
          setShowCart(false);
        } else {
          throw new Error("Error al procesar el pago en el backend");
        }
      } catch (error) {
        console.error("Error al procesar el pago en el backend:", error);
        toast.error("❌ Error al procesar el pago");
      } finally {
        setIsProcessingPayment(false);
      }
    };
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between p-4 border-b border-gray-200 bg-white shadow-md">
        <h1 className="text-xl font-bold text-black flex-1 md:flex-none">
          Nuestros Productos
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full sm:w-auto">
            <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-yellow-400 text-black px-4 py-2 rounded-full hover:bg-yellow-500"
          >
            Volver al Inicio
          </button>

          <button
            role="button"
            aria-label="Abrir carrito"
            className="relative text-2xl text-black cursor-pointer focus:outline-none ml-auto"
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
      </header>

      {/* Products */}
      <main className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                className="h-32 w-full object-contain mx-auto mb-4"
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
              {selectedProduct?.id === product.id && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col justify-center items-center rounded-lg shadow-lg text-black p-4">
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
      </main>

      {/* Carrito */}
      {showCart && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end"
          onClick={() => setShowCart(false)}
        >
          <div
            className="bg-white w-full sm:w-80 h-full shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4 text-black">Carrito</h2>
            {cart.length > 0 ? (
              <div>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center mb-2"
                  >
                    <div>
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-sm">
                        Cantidad: {item.quantity} x S/.{item.price.toFixed(2)}
                      </p>
                      <p className="text-sm font-bold">
                        Subtotal: S/.{" "}
                        {((item.quantity || 1) * item.price).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="text-red-600 font-bold"
                    >
                      X
                    </button>
                  </div>
                ))}
                <hr className="my-4" />
                <div className="text-right">
                  <p className="text-lg font-bold">
                    Total a pagar: S/.{" "}
                    {cart
                      .reduce(
                        (total, item) =>
                          total + (item.quantity || 1) * item.price,
                        0
                      )
                      .toFixed(2)}
                  </p>
                  <Button
                    onClick={pagarCompra}
                    className="w-full bg-yellow-400 mt-4"
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? "Procesando..." : "Pagar Carrito"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-600">
                El carrito está vacío.
              </p>
            )}
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

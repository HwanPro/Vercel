"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaShoppingCart, FaSearch } from "react-icons/fa";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

declare global {
  interface Window {
    Culqi?: {
      publicKey: string;
      settings: (config: {
        title: string;
        currency: string;
        description: string;
        amount: number;
      }) => void;
      open: () => void;
      close: () => void;
      token: (token: { id: string }) => void;
    };
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
  const [culqiErrorShown, setCulqiErrorShown] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const router = useRouter();

  // Cargar el script de Culqi
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.culqi.com/js/v4";
    script.async = true;
    script.onload = () => {
      console.log("Culqi script cargado correctamente");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // 1. Cargar carrito de localStorage al montar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  // 2. Guardar carrito en localStorage cada vez que cambie
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // 3. Cargar lista de productos
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products/public");
        if (!response.ok) {
          throw new Error("Error al cargar productos");
        }
        const data = await response.json();
        const formatted = data.map((p: { 
          item_id: string;
          item_name: string;
          item_description: string;
          item_price: number;
          item_discount?: number;
          item_stock?: number;
          item_image_url?: string;
        }) => ({
          id: p.item_id,
          name: p.item_name,
          description: p.item_description,
          price: p.item_price,
          discount: p.item_discount || 0,
          stock: p.item_stock || 0,
          imageUrl: p.item_image_url || "/placeholder-image.png",
        }));
        setProducts(formatted);
        setFilteredProducts(formatted);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        toast.error("❌ Error al cargar productos. Intenta nuevamente.");
      }
    };
    fetchProducts();
  }, []);

  // 4. Filtrar cada vez que cambie searchTerm
  useEffect(() => {
    const results = products.filter((prod) =>
      prod.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  // 5. Definir callbacks de Culqi (token y close) una sola vez


  // Añadir al carrito
  const handleAddToCart = (product: Product) => {
    if (quantity > product.stock) {
      toast.warn("⚠️ No hay suficiente stock disponible.");
      return;
    }
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      const newQty = (existing.quantity || 1) + quantity;
      if (newQty > product.stock) {
        toast.warn("⚠️ No puedes agregar más de lo disponible.");
        return;
      }
      setCart((prev) =>
        prev.map((it) =>
          it.id === product.id ? { ...it, quantity: newQty } : it
        )
      );
    } else {
      setCart([...cart, { ...product, quantity }]);
    }
    setSelectedProduct(null);
    setQuantity(1);
  };

  // Quitar producto del carrito
  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((it) => it.id !== id));
    toast.info("🗑 Producto eliminado del carrito.");
  };

  // Iniciar pago
  // Quita el useEffect(() => { ... }, [cart]) por completo
  // y mueve la lógica dentro de pagarCompra:

  const pagarCompra = () => {
    if (cart.length === 0) {
      toast.error("🛒 El carrito está vacío. Agrega productos antes de pagar.");
      return;
    }
    if (!window.Culqi) {
      if (!culqiErrorShown) {
        setCulqiErrorShown(true);
        toast.error("⚠️ Error al cargar Culqi. Intenta nuevamente.");
      }
      return;
    }
    if (isProcessingPayment) {
      console.log("Ya se está procesando el pago...");
      return;
    }

    setIsProcessingPayment(true);

    // Calcula el monto en céntimos:
    const amount =
      cart.reduce((acc, it) => acc + it.price * (it.quantity || 1), 0) * 100;

    // Aquí mismo definimos callback de token
    window.Culqi.token = async (token: { id: string }) => {
      try {
        const resp = await axios.post("/api/payments/culqi", {
          token: token.id,
          amount,
          description: "Compra en línea",
          email: "cliente@example.com",
        });

        if (resp.status === 200) {
          toast.success(
            "✅ Pago realizado con éxito. Recoge tu pedido en el local."
          );
          setCart([]);
          setShowCart(false);
        } else {
          throw new Error("Error al procesar el pago en backend");
        }
      } catch (err) {
        console.error("Error en backend Culqi:", err);
        toast.error("❌ Error al procesar el pago");
      } finally {
        setIsProcessingPayment(false);
      }
    };

    // Y definimos callback de close
    window.Culqi.close = () => {
      console.log("Modal Culqi cerrado/cancelado");
      setIsProcessingPayment(false);
      toast.error("❌ Pago cancelado o cerrado. Intenta nuevamente.");
    };

    // Configuración Culqi
    window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY!;
    window.Culqi.settings({
      title: "Tienda Online",
      currency: "PEN",
      description: "Compra en línea",
      amount,
    });

    console.log("Culqi configurado. Abriendo modal...");
    window.Culqi.open();
  };

  return (
    <div className="bg-white min-h-screen">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between p-4 border-b bg-white shadow-md">
        <h1 className="text-xl font-bold text-black flex-1">
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
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
            className="relative text-2xl text-black ml-auto"
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

      {/* LISTADO DE PRODUCTOS */}
      <main className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="relative bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center transition-transform hover:scale-105"
            >
              {prod.discount && prod.discount > 0 && (
                <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">
                  {prod.discount}% OFF
                </div>
              )}
              {prod.stock === 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 font-bold rounded">
                  Agotado
                </div>
              )}
              <Image
                src={prod.imageUrl}
                alt={prod.name}
                className="h-32 w-full object-contain mx-auto mb-4"
                width={128}
                height={128}
              />
              <h2 className="text-lg font-bold text-black">{prod.name}</h2>
              <p className="text-sm text-black">{prod.description}</p>
              <p className="text-yellow-400 font-bold">
                S/.{" "}
                {(
                  prod.price -
                  (prod.price * (prod.discount || 0)) / 100
                ).toFixed(2)}
              </p>
              {prod.stock > 0 ? (
                <button
                  onClick={() => setSelectedProduct(prod)}
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
              {selectedProduct?.id === prod.id && (
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
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-2 py-1 border rounded"
                    >
                      -
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-2 py-1 border rounded"
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="mt-4 bg-yellow-400 text-black px-4 py-2 rounded-full hover:bg-yellow-500"
                    onClick={() => handleAddToCart(prod)}
                  >
                    Agregar al carrito
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* CARRITO */}
      {showCart && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end"
          onClick={() => setShowCart(false)}
        >
          <div
            className="bg-white w-full sm:w-80 h-full shadow-lg p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCart(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold"
              aria-label="Cerrar carrito"
            >
              X
            </button>

            <h2 className="text-lg font-bold mb-4 text-black text-center">
              Carrito
            </h2>
            {cart.length > 0 ? (
              <div>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center mb-4 border-b pb-2"
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
                      .reduce((acc, i) => acc + (i.quantity || 1) * i.price, 0)
                      .toFixed(2)}
                  </p>
                  <button
                    onClick={pagarCompra}
                    className="w-full bg-yellow-400 mt-4 text-black hover:bg-yellow-500 py-2 rounded"
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? "Procesando..." : "Pagar Carrito"}
                  </button>
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

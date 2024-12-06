"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  item_id: string;
  item_name: string;
  item_description: string;
  item_price: number;
  item_image_url: string;
}

interface ClientData {
  profile_first_name: string;
  profile_last_name: string;
  profile_plan: string;
  profile_start_date: string;
  profile_end_date: string;
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);

  useEffect(() => {
    // Función para obtener los datos del cliente
    const fetchClientData = async () => {
      try {
        const response = await fetch("/api/clients/me");

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const data: ClientData = await response.json();
        setClientData(data);

        // Calcular los días restantes de la suscripción
        if (data.profile_end_date) {
          const endDate = new Date(data.profile_end_date);
          const today = new Date();
          const timeDiff = endDate.getTime() - today.getTime();
          const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          setRemainingDays(daysRemaining > 0 ? daysRemaining : 0);
        }
      } catch (error) {
        console.error("Error fetching client data:", error);
      }
    };

    fetchClientData();
  }, []);

  useEffect(() => {
    // Función para obtener los productos sugeridos
    const fetchSuggestedProducts = async () => {
      try {
        const response = await fetch("/api/products/public");
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText}`);
        }
        const data: Product[] = await response.json();

        setSuggestedProducts(data.slice(0, 5)); // Muestra 5 productos sugeridos
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchSuggestedProducts();
  }, []);

  // Cerrar el menú al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".profile-button")
      ) {
        setShowProfileMenu(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white relative">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-black">
        <h1 className="text-xl font-bold text-yellow-400">Mi Panel</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="relative profile-button"
          >
            <Image
              src={session?.user?.image || "/default-avatar.png"}
              alt={session?.user?.name || "Avatar"}
              className="h-10 w-10 object-cover rounded-full"
              width={40}
              height={40}
            />
          </button>
        </div>
      </div>

      {/* Perfil emergente */}
      {showProfileMenu && (
        <div
          ref={profileMenuRef}
          className="fixed top-16 right-4 bg-white text-black p-4 rounded shadow-lg z-50"
        >
          <h2 className="text-lg font-bold mb-2">Mi Perfil</h2>
          <p>
            <strong>Rol:</strong> Cliente
          </p>
          <div className="flex justify-between gap-4 mt-4">
            <button
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              onClick={handleSignOut}
            >
              Cerrar Sesión
            </button>
            <button
              className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400"
              onClick={() => setShowProfileMenu(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Contenido */}
      <h1 className="text-3xl font-bold mb-6 text-yellow-400">
        Bienvenido,{" "}
        {clientData?.profile_first_name || session?.user?.name || "Cliente"}
      </h1>

      {/* Mostrar sus suscripciones */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-yellow-400">Mi Suscripción</h2>
        <p>Plan: {clientData?.profile_plan || "Sin plan"}</p>
        <p>
          Fecha de inicio:{" "}
          {clientData?.profile_start_date
            ? new Date(clientData.profile_start_date).toLocaleDateString(
                "es-ES"
              )
            : "N/A"}
        </p>
        <p>
          Fecha de fin:{" "}
          {clientData?.profile_end_date
            ? new Date(clientData.profile_end_date).toLocaleDateString("es-ES")
            : "N/A"}
        </p>
        {remainingDays !== null && (
          <p>Días restantes: {remainingDays} días</p>
        )}
      </section>

      {/* Opciones adicionales */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-yellow-400">Opciones</h2>
        <div className="flex gap-4">
          <Link
            href="/client/reservar-clase"
            className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
          >
            Reservar Clase (Próximamente)
          </Link>
          <Link
            href="/products/public"
            className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
          >
            Ver Productos
          </Link>
        </div>
      </section>

      {/* Productos sugeridos */}
      <section>
        <h2 className="text-2xl font-bold text-yellow-400">
          Productos Sugeridos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {suggestedProducts.map((product) => (
            <div
              key={product.item_id}
              className="bg-white rounded-lg shadow-lg p-4 flex flex-col items-center text-center"
            >
              <Image
                src={product.item_image_url || "/placeholder-image.png"}
                alt={product.item_name || "Producto"}
                className="h-20 w-20 object-contain mb-4"
                width={80}
                height={80}
              />
              <h3 className="text-sm font-bold text-black">
                {product.item_name}
              </h3>
              <p className="text-xs text-gray-500">
                {product.item_description}
              </p>
              <p className="text-yellow-400 font-bold">
                S/. {product.item_price.toFixed(2)}
              </p>
              <Link
                href="/products/public"
                className="mt-2 bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-500"
              >
                Comprar
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

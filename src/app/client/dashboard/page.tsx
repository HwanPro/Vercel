"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

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
  profile_plan: string | null;
  profile_start_date: string | null;
  profile_end_date: string | null;
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      const response = await fetch("/api/clients/me");
      if (!response.ok) return;

      const data: ClientData = await response.json();
      setClientData(data);

      if (data.profile_end_date) {
        const endDate = new Date(data.profile_end_date);
        const today = new Date();
        setRemainingDays(
          Math.max(
            0,
            Math.ceil(
              (endDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
            )
          )
        );
      }
    };
    fetchClientData();

    const fetchProducts = async () => {
      const response = await fetch("/api/products/public");
      if (response.ok) setSuggestedProducts(await response.json());
    };
    fetchProducts();
  }, []);

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-yellow-400 pb-4">
        <h1 className="text-yellow-400 text-2xl font-bold">Mi Panel</h1>
        <button
          onClick={() => signOut()}
          className="text-yellow-400 hover:underline"
        >
          Cerrar Sesión
        </button>
      </header>

      {/* Bienvenida */}
      <section className="my-6">
        <h2 className="text-3xl text-yellow-400">
          Bienvenido,{" "}
          {clientData?.profile_first_name || session?.user?.name || "Cliente"}
        </h2>
      </section>

      {/* Suscripción */}
      {clientData?.profile_plan ? (
        <section className="my-6 bg-black p-6 rounded-lg shadow-lg border border-yellow-400">
          <h3 className="text-xl text-yellow-400 font-semibold text-center">
            Detalles de Mi Suscripción
          </h3>
          <div className="text-white">
            <p>
              <strong className="text-yellow-400">Plan:</strong>{" "}
              {clientData.profile_plan}
            </p>
            <p>
              <strong className="text-yellow-400">Fecha de inicio:</strong>{" "}
              {clientData.profile_start_date
                ? new Date(clientData.profile_start_date).toLocaleDateString()
                : "N/A"}
            </p>
            <p>
              <strong className="text-yellow-400">Fecha de fin:</strong>{" "}
              {clientData.profile_end_date
                ? new Date(clientData.profile_end_date).toLocaleDateString()
                : "N/A"}
            </p>
            <p>
              <strong className="text-yellow-400">Días restantes:</strong>{" "}
              {remainingDays} días
            </p>
          </div>
        </section>
      ) : (
        <section className="my-6 text-center">
          <p className="text-yellow-400">No tienes una suscripción activa.</p>
          <Link
            href="/#pricing"
            className="inline-block bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 mt-2"
          >
            ¡Adquiere un plan ahora!
          </Link>
        </section>
      )}

      {/* Opciones */}
      <section className="my-6">
        <h3 className="text-2xl text-yellow-400">Opciones</h3>
        <div className="flex gap-4">
          <Link
            href="/products/public"
            className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
          >
            Ver Productos
          </Link>
        </div>
      </section>

      {/* Productos sugeridos */}
      <section className="my-6">
        <h3 className="text-2xl text-yellow-400 mb-4">Productos Sugeridos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {suggestedProducts.length > 0 ? (
            suggestedProducts.map((product) => (
              <div
                key={product.item_id}
                className="bg-gray-900 text-white rounded-lg p-4 shadow-lg flex flex-col items-center border border-yellow-400"
              >
                <Image
                  src={product.item_image_url || "/placeholder.png"}
                  alt={product.item_name}
                  width={100}
                  height={100}
                  className="mb-4 rounded-lg"
                />
                <h4 className="font-bold text-lg">{product.item_name}</h4>
                <p className="text-sm text-gray-400">
                  {product.item_description}
                </p>
                <p className="text-yellow-400 font-bold mt-2">
                  S/. {product.item_price.toFixed(2)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">
              No hay productos disponibles en este momento.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

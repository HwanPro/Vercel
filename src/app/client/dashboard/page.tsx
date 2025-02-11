"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import QRScannerComponent from "@/components/QRScanner";

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
      try {
        const response = await fetch("/api/clients/me");
        if (!response.ok)
          throw new Error("Error obteniendo los datos del cliente.");

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
      } catch (error) {
        console.error("Error cargando los datos del cliente:", error);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products/public");
        if (!response.ok) throw new Error("Error obteniendo los productos.");

        setSuggestedProducts(await response.json());
      } catch (error) {
        console.error("Error cargando los productos sugeridos:", error);
      }
    };

    fetchClientData();
    fetchProducts();
  }, []);

  const handleComingSoon = () => {
    Swal.fire({
      title: "¡Próximamente!",
      text: "La función para reservar clases estará disponible muy pronto.",
      icon: "info",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#facc15",
      background: "#000000",
      color: "#ffffff",
    });
  };

  const handleQRScan = async (data: string) => {
    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData: data }),
      });

      if (!response.ok) {
        throw new Error("Error al registrar la asistencia.");
      }

      Swal.fire({
        title: "Asistencia Registrada",
        text: "Tu ingreso ha sido registrado correctamente.",
        icon: "success",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#facc15",
        background: "#000000",
        color: "#ffffff",
      });
    } catch (error) {
      console.error("Error registrando asistencia:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo registrar la asistencia. Inténtalo nuevamente.",
        icon: "error",
        confirmButtonText: "Intentar de nuevo",
        confirmButtonColor: "#facc15",
        background: "#000000",
        color: "#ffffff",
      });
    }
  };

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

      {/* Escaneo de QR */}
      <section className="my-6">
        <h3 className="text-2xl text-yellow-400">
          Escanear Código QR para Ingreso
        </h3>
        <QRScannerComponent onScan={handleQRScan} />
      </section>

      {/* Bienvenida */}
      <section className="my-6">
        <h2 className="text-3xl text-yellow-400">
          Bienvenido,{" "}
          {clientData?.profile_first_name || session?.user?.name || "Cliente"}
        </h2>
      </section>

      {/* Suscripción */}
      {clientData?.profile_plan ? (
        <section className="my-6 bg-gray-800 p-4 rounded-lg shadow-lg">
          <h3 className="text-xl text-yellow-400 font-semibold">
            Mi Suscripción
          </h3>
          <p>
            <strong>Plan:</strong> {clientData.profile_plan}
          </p>
          <p>
            <strong>Fecha de inicio:</strong>{" "}
            {clientData.profile_start_date
              ? new Date(clientData.profile_start_date).toLocaleDateString()
              : "N/A"}
          </p>
          <p>
            <strong>Fecha de fin:</strong>{" "}
            {clientData.profile_end_date
              ? new Date(clientData.profile_end_date).toLocaleDateString()
              : "N/A"}
          </p>
          <p>
            <strong>Días restantes:</strong> {remainingDays} días
          </p>
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
          <button
            onClick={handleComingSoon}
            className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
          >
            Reservar Clase (Próximamente)
          </button>
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
          {suggestedProducts.map((product) => (
            <div
              key={product.item_id}
              className="bg-white text-black rounded-lg p-4 shadow-lg flex flex-col items-center"
            >
              <Image
                src={product.item_image_url || "/placeholder.png"}
                alt={product.item_name}
                width={80}
                height={80}
                className="mb-4"
              />
              <h4 className="font-bold text-lg">{product.item_name}</h4>
              <p className="text-sm text-gray-500">
                {product.item_description}
              </p>
              <p className="text-yellow-400 font-bold mt-2">
                S/. {product.item_price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

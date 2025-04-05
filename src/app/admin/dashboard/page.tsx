"use client";

import { useState, useEffect } from "react";

import { Home, Bell, Menu, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/ui/table";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProfileModal from "@/ui/components/ProfileModal";

export default function AdminDashboard() {
  const { data: session } = useSession();

  // Estados para menú, notificaciones, etc.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications] = useState<{ id: string; message: string }[]>([]);

  // Ejemplo de datos de Dashboard
  const [dashboardData, setDashboardData] = useState({
    totalIncome: 0,
    newClients: 0,
    productSales: 0,
    classAttendance: 0,
  });

  async function fetchDashboard() {
    try {
      const resp = await fetch("/api/dashboard");
      if (!resp.ok) {
        throw new Error("No se pudo obtener los datos del dashboard");
      }
      const data = await resp.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetchDashboard:", error);
    }
  }

  useEffect(() => {
    fetchDashboard();
    // also fetchRecentClients(), fetchProducts(), etc.
  }, []);
  // Clientes y productos
  const [recentClients, setRecentClients] = useState<
    {
      id: string;
      name: string;
      lastName: string;
      plan: string;
      membershipStartFormatted: string;
      membershipEndFormatted: string;
      daysRemaining: number | string;
    }[]
  >([]);
  const [products, setProducts] = useState<
    { item_id: string; item_name: string; item_stock: number }[]
  >([]);

  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Control modal perfil
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Carga de clientes
  const fetchRecentClients = async () => {
    setLoadingClients(true);
    try {
      const response = await fetch("/api/clients", { credentials: "include" });
      if (!response.ok) {
        if (response.status === 401) {
          toast.error("No autorizado. Redirigiendo a login...");
          window.location.href = "/auth/login";
          return;
        }
        throw new Error("Error al obtener los clientes recientes");
      }
      const data = await response.json();

      // Filtramos no-admin
      const filtered = data.filter(
        (c: { user: { role: string } }) => c.user.role !== "admin"
      );

      // Procesar datos
      const processed = filtered.map(
        (c: {
          profile_id: string;
          profile_first_name: string;
          profile_last_name: string;
          profile_plan: string;
          profile_start_date: string;
          profile_end_date: string;
        }) => {
          const membershipStart = c.profile_start_date
            ? new Date(c.profile_start_date)
            : null;
          const membershipEnd = c.profile_end_date
            ? new Date(c.profile_end_date)
            : null;

          let daysRemaining: number | string = "N/A";
          if (membershipEnd && !isNaN(membershipEnd.getTime())) {
            const timeDiff = membershipEnd.getTime() - Date.now();
            daysRemaining =
              timeDiff > 0
                ? Math.ceil(timeDiff / (1000 * 3600 * 24))
                : "Finalizado";
          }

          return {
            id: c.profile_id,
            name: c.profile_first_name || "Sin nombre",
            lastName: c.profile_last_name || "Sin apellido",
            plan: c.profile_plan || "Sin plan",
            membershipStartFormatted: membershipStart
              ? membershipStart.toLocaleDateString("es-ES")
              : "N/A",
            membershipEndFormatted: membershipEnd
              ? membershipEnd.toLocaleDateString("es-ES")
              : "N/A",
            daysRemaining,
          };
        }
      );

      setRecentClients(processed);
    } catch (error) {
      console.error("Error fetching recent clients:", error);
      toast.error("Error al obtener los clientes recientes");
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch("/api/products", { credentials: "include" });
      if (!response.ok) {
        if (response.status === 401) {
          toast.error("No autorizado. Por favor inicia sesión.");
          window.location.href = "/auth/login";
          return;
        }
        throw new Error("Error al obtener los productos");
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error al obtener los productos:", error);
      toast.error("Error al obtener los productos");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchRecentClients();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Encabezado */}
      <header className="px-4 lg:px-6 h-14 flex items-center bg-black relative">
        <Link
          className="flex items-center justify-center no-underline"
          href="/"
        >
          <Home className="h-6 w-6 text-yellow-400 mr-2" />
          <span className="text-yellow-400">Inicio</span>
        </Link>

        <div className="ml-auto flex items-center gap-4">
          {/* Botón campanita */}
          <button
            className="relative text-yellow-400 w-8"
            onClick={() => setNotificationsOpen((prev) => !prev)}
          >
            <Bell className="h-6 w-6" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 bg-red-500 text-white text-xs rounded-full">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Menú hamburguesa */}
          <button
            className="lg:hidden text-yellow-400"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Menú de navegación */}
        <nav
          className={`absolute lg:static top-14 right-0 bg-black lg:bg-transparent lg:flex items-center gap-4 sm:gap-6 p-4 lg:p-0 z-50 ${
            isMenuOpen ? "block" : "hidden"
          }`}
        >
          <Link
            href="/admin/clients"
            className="block text-sm font-medium text-white hover:text-yellow-400 no-underline"
          >
            Clientes
          </Link>
          <Link
            href="/admin/products"
            className="block text-sm font-medium text-white hover:text-yellow-400 no-underline"
          >
            Productos
          </Link>
          <Link
            href="/admin/reportes"
            className="block text-sm font-medium text-white hover:text-yellow-400 no-underline"
          >
            Reportes
          </Link>
          <Link
            href="/admin/attendence"
            className="block text-sm font-medium text-white hover:text-yellow-400 no-underline"
          >
            Asistencia
          </Link>
          <Link
            href="/admin/Edit"
            className="block text-sm font-medium text-white hover:text-yellow-400 no-underline"
          >
            Editar
          </Link>
          <button
            onClick={() => setShowProfileModal(true)}
            className="block text-sm font-medium text-white hover:text-yellow-400"
          >
            Mi Perfil
          </button>
        </nav>

        {/* Menú notificaciones */}
        {notificationsOpen && (
          <div className="absolute top-14 right-16 bg-white text-black p-4 rounded shadow-lg z-50 w-64 max-h-96 overflow-auto">
            <h3 className="font-bold mb-2">Notificaciones</h3>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className="mb-2">
                  <p>{notification.message}</p>
                </div>
              ))
            ) : (
              <p>No hay notificaciones</p>
            )}
          </div>
        )}
      </header>

      {/* Contenido principal */}
      <main className="px-6">
        <h1 className="text-3xl font-bold mb-6 text-yellow-400 text-center">
          Panel de Administración
        </h1>

        {/* Resumen Dashboard */}
        <section className="mb-10 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white text-black rounded-md shadow p-4">
            <p className="text-sm font-medium">Ingresos Totales</p>
            <h3 className="text-2xl font-bold">
              S/. {dashboardData.totalIncome}
            </h3>
          </div>
          <div className="bg-white text-black rounded-md shadow p-4">
            <p className="text-sm font-medium">Nuevos Clientes</p>
            <h3 className="text-2xl font-bold">{dashboardData.newClients}</h3>
          </div>
          <div className="bg-white text-black rounded-md shadow p-4">
            <p className="text-sm font-medium">Ventas de Productos</p>
            <h3 className="text-2xl font-bold">{dashboardData.productSales}</h3>
          </div>
          <div className="bg-white text-black rounded-md shadow p-4">
            <p className="text-sm font-medium">Asistencia a Clases</p>
            <h3 className="text-2xl font-bold">
              {dashboardData.classAttendance}
            </h3>
          </div>
        </section>

        {/* Clientes Recientes */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-yellow-400">
            Clientes Recientes
          </h2>
          {loadingClients ? (
            <p className="text-yellow-400">Cargando clientes...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Apellidos</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Días</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentClients.length > 0 ? (
                  recentClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="truncate">{client.name}</TableCell>
                      <TableCell>{client.lastName}</TableCell>
                      <TableCell>{client.plan}</TableCell>
                      <TableCell>{client.membershipStartFormatted}</TableCell>
                      <TableCell>{client.membershipEndFormatted}</TableCell>
                      <TableCell>{client.daysRemaining}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      No hay clientes disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </section>

        {/* Productos */}
        <section>
          <h2 className="text-2xl font-bold text-yellow-400">
            Gestión de Productos
          </h2>
          {loadingProducts ? (
            <p className="text-yellow-400">Cargando productos...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.item_id}>
                      <TableCell className="truncate">
                        {product.item_name}
                      </TableCell>
                      <TableCell>{product.item_stock}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2}>
                      No hay productos disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </section>
      </main>

      {/* Modal de Perfil */}
      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          // OJO: Asegúrate de pasarle userName, firstName, userPhone, etc.
          userName={session?.user?.name ?? ""}
          firstName={session?.user?.name ?? ""}
          userLastName={session?.user?.name?.split(" ")[1] ?? ""}
          userPhone={session?.user?.phoneNumber ?? ""}
          userEmergencyPhone=""
          userRole={session?.user?.role ?? ""}
          profileImage={session?.user?.image ?? ""}
        />
      )}
    </div>
  );
}

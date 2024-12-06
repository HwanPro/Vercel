// src/app/admin/dashboard/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import { Home, Bell } from "lucide-react";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Estado para controlar la visibilidad del menú de notificaciones
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Estados para datos del dashboard
  const [dashboardData, setDashboardData] = useState({
    totalIncome: 0,
    newClients: 0,
    productSales: 0,
    classAttendance: 0,
  });
  const [products, setProducts] = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
    
    };

    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Error al obtener los productos");
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Error al obtener los productos");
      }
    };

    const fetchRecentClients = async () => {
      try {
        const response = await fetch("/api/clients", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Error al obtener los clientes recientes");
        }
        const data = await response.json();

        // Procesar datos de clientes y calcular días restantes
        const processedClients = data.map((client: any) => {
          const membershipStart = new Date(client.profile_start_date);
          const membershipEnd = new Date(client.profile_end_date);
          const today = new Date();
          const timeDiff = membershipEnd.getTime() - today.getTime();
          const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

          return {
            id: client.profile_id,
            name: client.profile_first_name,
            lastName: client.profile_last_name,
            plan: client.profile_plan,
            membershipStartFormatted: membershipStart.toLocaleDateString("es-ES"),
            membershipEndFormatted: membershipEnd.toLocaleDateString("es-ES"),
            daysRemaining,
            email: client.user.email,
          };
        });

        setRecentClients(processedClients);

        // Calcular notificaciones
        calculateNotifications(processedClients);
      } catch (error) {
        console.error("Error fetching recent clients:", error);
        toast.error("Error al obtener los clientes recientes");
      }
    };

    fetchDashboardData();
    fetchProducts();
    fetchRecentClients();
  }, []);

  // Función para manejar el cierre de sesión
  const handleSignOut = async () => {
    await signOut();
  };

  // Función para calcular notificaciones basadas en los días restantes
  const calculateNotifications = (clients: any[]) => {
    const notificationsList = clients
      .filter(
        (client) =>
          client.daysRemaining === 10 || client.daysRemaining === 1
      )
      .map((client) => ({
        id: client.id,
        message: `La suscripción de ${client.name} ${client.lastName} vence en ${client.daysRemaining} días.`,
        daysRemaining: client.daysRemaining,
        clientEmail: client.email, // Asegúrate de tener el email del cliente
      }));
    setNotifications(notificationsList);
  };

  // Función para enviar correos electrónicos (placeholder)
  const sendEmailNotifications = async () => {
    // Implementa la lógica para enviar correos electrónicos a los clientes
    // Puedes utilizar una API de envío de correos como SendGrid, Mailgun, etc.
  };

  return (
    <div className="px-6 bg-black min-h-screen text-white">
      <ToastContainer />
      <header className="px-4 lg:px-6 h-14 flex items-center bg-black relative">
        <Link
          className="flex items-center justify-center no-underline"
          href="/"
        >
          <Home className="h-6 w-6 text-yellow-400 mr-2" />
          <span className="text-yellow-400">Inicio</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/admin/clients"
            className="text-sm font-medium text-white hover:text-yellow-400 no-underline"
          >
            Clientes
          </Link>
          <Link
            href="/admin/products"
            className="text-sm font-medium text-white hover:text-yellow-400 no-underline"
          >
            Productos
          </Link>
          <Link
            href="/admin/reportes"
            className="text-sm font-medium text-white hover:text-yellow-400 no-underline"
          >
            Reportes
          </Link>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="text-sm font-medium text-white hover:text-yellow-400"
          >
            Mi Perfil
          </button>
          <button
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="text-sm font-medium text-white hover:text-yellow-400 relative"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 bg-red-500 text-white text-xs rounded-full">
                {notifications.length}
              </span>
            )}
          </button>
        </nav>

        {/* Menú de perfil */}
        {profileOpen && (
          <div className="absolute top-14 right-4 bg-white text-black p-4 rounded shadow-lg z-50">
            <p>
              <strong>Email:</strong> {session?.user?.email || "N/A"}
            </p>
            <p>
              <strong>Rol:</strong> {session?.user?.role || "N/A"}
            </p>
            <button
              className="mt-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              onClick={handleSignOut}
            >
              Cerrar Sesión
            </button>
          </div>
        )}

        {/* Menú de notificaciones */}
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

      <h1 className="text-3xl font-bold mb-6 text-yellow-400">
        Panel de Administración
      </h1>

      {/* Resumen del Dashboard */}
      <section className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <h3 className="text-2xl font-bold">
              {dashboardData.productSales}
            </h3>
          </div>
          <div className="bg-white text-black rounded-md shadow p-4">
            <p className="text-sm font-medium">Asistencia a Clases</p>
            <h3 className="text-2xl font-bold">
              {dashboardData.classAttendance}
            </h3>
          </div>
        </div>
      </section>

      {/* Clientes Recientes */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-yellow-400">
          Clientes Recientes
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellidos</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Fecha de Inicio</TableHead>
              <TableHead>Fecha de Fin</TableHead>
              <TableHead>Días Restantes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentClients.length > 0 ? (
              recentClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.lastName}</TableCell>
                  <TableCell>{client.plan}</TableCell>
                  <TableCell>{client.membershipStartFormatted}</TableCell>
                  <TableCell>{client.membershipEndFormatted}</TableCell>
                  <TableCell>{client.daysRemaining}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>No hay clientes disponibles</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      {/* Productos */}
      <section>
        <h2 className="text-2xl font-bold text-yellow-400">
          Gestión de Productos
        </h2>
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
                  <TableCell>{product.item_name}</TableCell>
                  <TableCell>{product.item_stock}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2}>No hay productos disponibles</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

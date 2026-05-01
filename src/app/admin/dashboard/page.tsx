"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Home, Menu, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Button } from "@/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { cn } from "@/lib/utils";

interface DashboardData {
  totalIncome: number;
  newClients: number;
  productSales: number;
  classAttendance: number;
  todayAttendance: number;
  activeMemberships: number;
  lowStockProducts: number;
  lastUpdated: string;
}

interface RecentClient {
  id: string;
  name: string;
  lastName: string;
  plan: string;
  membershipStartFormatted: string;
  membershipEndFormatted: string;
  daysRemaining: number | string;
}

interface Product {
  item_id: string;
  item_name: string;
  item_stock: number;
}

interface Notification {
  id: string;
  message: string;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  helper: string;
  tone?: "default" | "warning" | "success";
}

const emptyDashboardData: DashboardData = {
  totalIncome: 0,
  newClients: 0,
  productSales: 0,
  classAttendance: 0,
  todayAttendance: 0,
  activeMemberships: 0,
  lowStockProducts: 0,
  lastUpdated: "",
};

const navigationItems = [
  { href: "/admin/clients", label: "Clientes" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/images", label: "Imágenes" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/profile", label: "Perfil" },
  { href: "/admin/attendence", label: "Historial" },
  { href: "/check-in", label: "Recepción" },
  { href: "/admin/routines", label: "Rutinas" },
  { href: "/admin/Edit", label: "Contenido" },
];

const cardClass =
  "rounded-lg border border-yellow-400/25 bg-black p-4 shadow-sm transition hover:border-yellow-400/60";

function formatCurrency(value: number) {
  return `S/. ${Number(value).toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) return "N/A";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("es-PE");
}

function getDaysRemaining(value?: string) {
  if (!value) return "N/A";

  const membershipEnd = new Date(value);
  if (Number.isNaN(membershipEnd.getTime())) return "N/A";

  const timeDiff = membershipEnd.getTime() - Date.now();
  return timeDiff > 0 ? Math.ceil(timeDiff / (1000 * 3600 * 24)) : "Finalizado";
}

function MetricCard({ label, value, helper, tone = "default" }: MetricCardProps) {
  return (
    <div className={cardClass}>
      <p className="text-sm font-medium text-white">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tracking-tight text-white",
          tone === "success" && "text-yellow-300",
          tone === "warning" && "text-orange-400",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-white/50">{helper}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const isRedirecting = useRef(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications] = useState<Notification[]>([]);
  const [dashboardData, setDashboardData] =
    useState<DashboardData>(emptyDashboardData);
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [metricsErrorShown, setMetricsErrorShown] = useState(false);

  const lastUpdatedDate = dashboardData.lastUpdated
    ? new Date(dashboardData.lastUpdated)
    : null;
  const lastUpdatedLabel =
    lastUpdatedDate && !Number.isNaN(lastUpdatedDate.getTime())
      ? lastUpdatedDate.toLocaleString("es-PE")
      : "Sin actualización";

  function redirectToLogin() {
    if (isRedirecting.current) return;

    isRedirecting.current = true;
    toast.error("Sesión expirada. Redirigiendo a login...");
    router.replace("/auth/login");
  }

  async function fetchDashboard(silent = false) {
    try {
      const res = await fetch("/api/admin/metrics", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401) {
          redirectToLogin();
          return;
        }

        throw new Error("Error al obtener métricas");
      }

      const data = await res.json();
      setDashboardData({
        totalIncome: Number(data?.totalIncome ?? 0),
        newClients: Number(data?.newClients ?? 0),
        productSales: Number(data?.productSales ?? 0),
        classAttendance: Number(data?.classAttendance ?? 0),
        todayAttendance: Number(data?.todayAttendance ?? 0),
        activeMemberships: Number(data?.activeMemberships ?? 0),
        lowStockProducts: Number(data?.lowStockProducts ?? 0),
        lastUpdated: data?.lastUpdated || new Date().toISOString(),
      });
      if (metricsErrorShown) setMetricsErrorShown(false);
    } catch (error) {
      console.error("Error fetchDashboard:", error);
      if (!silent && !metricsErrorShown) {
        toast.error("Error al cargar métricas del dashboard");
        setMetricsErrorShown(true);
      }
    }
  }

  async function fetchRecentClients(silent = false) {
    if (!silent) setLoadingClients(true);

    try {
      const response = await fetch("/api/clients", { credentials: "include" });

      if (!response.ok) {
        if (response.status === 401) {
          redirectToLogin();
          return;
        }

        throw new Error("Error al obtener los clientes recientes");
      }

      const data = await response.json();
      const filtered = data.filter(
        (client: { user: { role: string } }) => client.user.role !== "admin",
      );

      setRecentClients(
        filtered.map(
          (client: {
            profile_id: string;
            profile_first_name: string;
            profile_last_name: string;
            profile_plan: string;
            profile_start_date?: string;
            profile_end_date?: string;
          }) => ({
            id: client.profile_id,
            name: client.profile_first_name || "Sin nombre",
            lastName: client.profile_last_name || "Sin apellido",
            plan: client.profile_plan || "Sin plan",
            membershipStartFormatted: formatDate(client.profile_start_date),
            membershipEndFormatted: formatDate(client.profile_end_date),
            daysRemaining: getDaysRemaining(client.profile_end_date),
          }),
        ),
      );
    } catch (error) {
      console.error("Error fetching recent clients:", error);
      if (!silent) toast.error("Error al obtener los clientes recientes");
    } finally {
      if (!silent) setLoadingClients(false);
    }
  }

  async function fetchProducts(silent = false) {
    if (!silent) setLoadingProducts(true);

    try {
      const response = await fetch("/api/products", { credentials: "include" });

      if (!response.ok) {
        if (response.status === 401) {
          redirectToLogin();
          return;
        }

        throw new Error("Error al obtener los productos");
      }

      setProducts(await response.json());
    } catch (error) {
      console.error("Error al obtener los productos:", error);
      if (!silent) toast.error("Error al obtener los productos");
    } finally {
      if (!silent) setLoadingProducts(false);
    }
  }

  async function refreshAll(silent = false) {
    if (silent) setRefreshing(true);
    await Promise.all([
      fetchDashboard(silent),
      fetchRecentClients(silent),
      fetchProducts(silent),
    ]);
    if (silent) setRefreshing(false);
  }

  useEffect(() => {
    refreshAll(false);

    const interval = setInterval(async () => {
      await refreshAll(true);
    }, 300000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <ToastContainer position="top-right" autoClose={3000} />

      <header className="sticky top-0 z-40 border-b border-yellow-400/15 bg-black/95 px-4 backdrop-blur lg:px-6">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4">
          <Link
            className="flex items-center gap-2 text-sm font-semibold text-wolf-primary no-underline transition hover:text-yellow-200"
            href="/"
          >
            <Home className="h-5 w-5" />
            Inicio
          </Link>

          <nav
            className={cn(
              "absolute right-4 top-16 hidden min-w-48 rounded-lg border border-yellow-400/20 bg-black p-3 shadow-xl lg:static lg:ml-auto lg:flex lg:min-w-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none",
              isMenuOpen && "block",
            )}
          >
            <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-white/80 no-underline transition hover:bg-yellow-400/10 hover:text-yellow-300"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-2">
            <button
              type="button"
              aria-label="Mostrar notificaciones"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-wolf-primary transition hover:bg-yellow-400/10"
              onClick={() => setNotificationsOpen((prev) => !prev)}
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-wolf-danger px-1 text-[10px] font-bold text-white">
                  {notifications.length}
                </span>
              )}
            </button>

            <button
              type="button"
              aria-label="Abrir menú"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-wolf-primary transition hover:bg-yellow-400/10 lg:hidden"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {notificationsOpen && (
            <div className="absolute right-4 top-16 z-50 max-h-96 w-72 overflow-auto rounded-lg border border-yellow-400/25 bg-white p-4 text-black shadow-xl">
              <h3 className="mb-2 font-semibold">Notificaciones</h3>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <p key={notification.id} className="mb-2 text-sm text-black/70">
                    {notification.message}
                  </p>
                ))
              ) : (
                <p className="text-sm text-black/70">No hay notificaciones</p>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 border-b border-yellow-400/15 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-wolf-primary">Administración</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Panel operativo
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Última actualización: {lastUpdatedLabel}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => refreshAll(true)}
            disabled={refreshing}
            variant="outline"
            className="border-yellow-400/70 bg-transparent text-yellow-300 hover:bg-yellow-400 hover:text-black"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            {refreshing ? "Actualizando" : "Actualizar"}
          </Button>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Ingresos totales"
            value={formatCurrency(dashboardData.totalIncome)}
            helper="Todos los pagos"
            tone="success"
          />
          <MetricCard
            label="Nuevos clientes"
            value={dashboardData.newClients}
            helper="Últimos 30 días"
          />
          <MetricCard
            label="Asistencia hoy"
            value={dashboardData.todayAttendance}
            helper="Check-ins de hoy"
          />
          <MetricCard
            label="Membresías activas"
            value={dashboardData.activeMemberships}
            helper="Clientes activos"
          />
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            label="Asistencia semanal"
            value={dashboardData.classAttendance}
            helper="Últimos 7 días"
          />
          <MetricCard
            label="Ventas de productos"
            value={formatCurrency(dashboardData.productSales)}
            helper="Total vendido"
            tone="success"
          />
          <MetricCard
            label="Stock bajo"
            value={dashboardData.lowStockProducts}
            helper="Productos ≤ 10 unidades"
            tone={dashboardData.lowStockProducts > 0 ? "warning" : "default"}
          />
        </section>

        {refreshing && (
          <p className="mb-6 text-sm text-wolf-primary">Actualizando datos...</p>
        )}

        <section className="mb-8 rounded-lg border border-yellow-400/25 bg-black p-4">
          <h2 className="mb-4 text-xl font-semibold text-white">Clientes recientes</h2>
          {loadingClients ? (
            <p className="text-sm text-wolf-primary">Cargando clientes...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-yellow-400/15 hover:bg-transparent">
                    <TableHead className="text-white">Nombre</TableHead>
                    <TableHead className="text-white">Apellidos</TableHead>
                    <TableHead className="text-white">Plan</TableHead>
                    <TableHead className="text-white">Inicio</TableHead>
                    <TableHead className="text-white">Fin</TableHead>
                    <TableHead className="text-white">Días</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentClients.length > 0 ? (
                    recentClients.map((client) => (
                      <TableRow
                        key={client.id}
                        className="border-yellow-400/10 hover:bg-yellow-400/5"
                      >
                        <TableCell className="max-w-48 truncate text-white">
                          {client.name}
                        </TableCell>
                        <TableCell className="text-white/80">{client.lastName}</TableCell>
                        <TableCell className="text-white/80">{client.plan}</TableCell>
                        <TableCell className="text-white/70">
                          {client.membershipStartFormatted}
                        </TableCell>
                        <TableCell className="text-white/70">
                          {client.membershipEndFormatted}
                        </TableCell>
                        <TableCell className="text-white/70">
                          {client.daysRemaining}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-yellow-400/10">
                      <TableCell colSpan={6} className="text-white/50">
                        No hay clientes disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-yellow-400/25 bg-black p-4">
          <h2 className="mb-4 text-xl font-semibold text-white">Gestión de productos</h2>
          {loadingProducts ? (
            <p className="text-sm text-wolf-primary">Cargando productos...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-yellow-400/15 hover:bg-transparent">
                    <TableHead className="text-white">Nombre</TableHead>
                    <TableHead className="text-white">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length > 0 ? (
                    products.map((product) => (
                      <TableRow
                        key={product.item_id}
                        className="border-yellow-400/10 hover:bg-yellow-400/5"
                      >
                        <TableCell className="max-w-96 truncate text-white">
                          {product.item_name}
                        </TableCell>
                        <TableCell className="text-white/80">
                          {product.item_stock}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-yellow-400/10">
                      <TableCell colSpan={2} className="text-white/50">
                        No hay productos disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

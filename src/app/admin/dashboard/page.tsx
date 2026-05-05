"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Home, Menu, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  { href: "/admin/sales", label: "Ventas" },
  { href: "/admin/images", label: "Imágenes" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/profile", label: "Perfil" },
  { href: "/admin/attendence", label: "Historial" },
  { href: "/check-in", label: "Recepción" },
  { href: "/admin/routines", label: "Rutinas" },
  { href: "/admin/Edit", label: "Contenido" },
];

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
  const valueColor =
    tone === "success" ? "#FFC21A" : tone === "warning" ? "#FF7A1A" : "#fff";
  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid rgba(255,194,26,0.15)",
        borderRadius: 14,
        padding: "20px 20px 16px",
        transition: "border-color 0.15s",
      }}
    >
      <p
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#FFC21A",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
          fontSize: 40,
          color: valueColor,
          margin: "8px 0 4px",
          lineHeight: 1,
          letterSpacing: "0.02em",
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
        {helper}
      </p>
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
        if (res.status === 401) { redirectToLogin(); return; }
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
        if (response.status === 401) { redirectToLogin(); return; }
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
        if (response.status === 401) { redirectToLogin(); return; }
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

  const thStyles: React.CSSProperties = {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#FFC21A",
    borderBottom: "1px solid rgba(255,194,26,0.15)",
    background: "#141414",
    fontFamily: "'Inter', system-ui, sans-serif",
  };

  const tdStyles: React.CSSProperties = {
    padding: "12px 16px",
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    borderBottom: "1px solid rgba(255,194,26,0.07)",
    fontFamily: "'Inter', system-ui, sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          borderBottom: "1px solid rgba(255,194,26,0.15)",
          background: "rgba(10,10,10,0.97)",
          backdropFilter: "blur(8px)",
          padding: "0 24px",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", height: 64, alignItems: "center", gap: 16 }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              color: "#FFC21A",
            }}
          >
            <Home style={{ width: 18, height: 18 }} />
            Inicio
          </Link>

          <nav
            className={cn(
              "absolute right-4 top-16 hidden min-w-48 rounded-lg border border-yellow-400/20 bg-black p-3 shadow-xl lg:static lg:ml-auto lg:flex lg:min-w-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none",
              isMenuOpen && "block",
            )}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.6)",
                    textDecoration: "none",
                    transition: "background 0.12s, color 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,194,26,0.08)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#FFC21A";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)";
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              aria-label="Mostrar notificaciones"
              style={{
                position: "relative",
                display: "inline-flex",
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "#FFC21A",
                cursor: "pointer",
              }}
              onClick={() => setNotificationsOpen((prev) => !prev)}
            >
              <Bell style={{ width: 18, height: 18 }} />
              {notifications.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    right: 6,
                    top: 6,
                    display: "inline-flex",
                    width: 16,
                    height: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: "#E5484D",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {notifications.length}
                </span>
              )}
            </button>

            <button
              type="button"
              aria-label="Abrir menú"
              className="lg:hidden"
              style={{
                display: "inline-flex",
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "#FFC21A",
                cursor: "pointer",
              }}
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {isMenuOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
            </button>
          </div>

          {notificationsOpen && (
            <div
              style={{
                position: "absolute",
                right: 16,
                top: 68,
                zIndex: 50,
                maxHeight: 384,
                width: 288,
                overflowY: "auto",
                borderRadius: 12,
                border: "1px solid rgba(255,194,26,0.25)",
                background: "#141414",
                padding: 16,
                boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
              }}
            >
              <h3 style={{ marginBottom: 8, fontWeight: 700, fontSize: 14, color: "#fff" }}>Notificaciones</h3>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <p key={notification.id} style={{ marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                    {notification.message}
                  </p>
                ))
              ) : (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>No hay notificaciones</p>
              )}
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page hero strip */}
        <div
          style={{
            background: "linear-gradient(135deg, #141414 0%, #0A0A0A 100%)",
            border: "1px solid rgba(255,194,26,0.25)",
            borderRadius: 14,
            padding: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#FFC21A",
                margin: "0 0 8px",
              }}
            >
              Hoy
            </p>
            <p
              style={{
                fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
                fontSize: 64,
                color: "#fff",
                margin: 0,
                lineHeight: 1,
                letterSpacing: "0.02em",
              }}
            >
              <span style={{ color: "#FFC21A" }}>{dashboardData.todayAttendance}</span> CHECK-INS
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
              Última actualización: {lastUpdatedLabel}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ background: "#141414", border: "1px solid rgba(255,194,26,0.15)", borderRadius: 10, padding: "14px 20px", minWidth: 120 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>Activos</p>
              <p style={{ fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif", fontSize: 32, color: "#2EBD75", margin: 0 }}>{dashboardData.activeMemberships}</p>
            </div>
            <div style={{ background: "#141414", border: "1px solid rgba(255,194,26,0.15)", borderRadius: 10, padding: "14px 20px", minWidth: 120 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>Stock bajo</p>
              <p style={{ fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif", fontSize: 32, color: dashboardData.lowStockProducts > 0 ? "#FF7A1A" : "#FFC21A", margin: 0 }}>{dashboardData.lowStockProducts}</p>
            </div>
            <button
              type="button"
              onClick={() => refreshAll(true)}
              disabled={refreshing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 40,
                padding: "0 16px",
                background: "transparent",
                border: "1px solid rgba(255,194,26,0.35)",
                borderRadius: 10,
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              <RefreshCw style={{ width: 14, height: 14 }} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Actualizando" : "Actualizar"}
            </button>
          </div>
        </div>

        {/* Metric cards row 1 */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
          <MetricCard label="Ingresos totales" value={formatCurrency(dashboardData.totalIncome)} helper="Todos los pagos" tone="success" />
          <MetricCard label="Nuevos clientes" value={dashboardData.newClients} helper="Últimos 30 días" />
          <MetricCard label="Asistencia hoy" value={dashboardData.todayAttendance} helper="Check-ins de hoy" />
          <MetricCard label="Membresías activas" value={dashboardData.activeMemberships} helper="Clientes activos" />
        </section>

        {/* Metric cards row 2 */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          <MetricCard label="Asistencia semanal" value={dashboardData.classAttendance} helper="Últimos 7 días" />
          <MetricCard label="Ventas de productos" value={formatCurrency(dashboardData.productSales)} helper="Total vendido" tone="success" />
          <MetricCard label="Stock bajo" value={dashboardData.lowStockProducts} helper="Productos ≤ 10 unidades" tone={dashboardData.lowStockProducts > 0 ? "warning" : "default"} />
        </section>

        {refreshing && (
          <p style={{ marginBottom: 24, fontSize: 13, color: "#FFC21A" }}>Actualizando datos...</p>
        )}

        {/* Recent clients table */}
        <section
          style={{
            background: "#141414",
            border: "1px solid rgba(255,194,26,0.15)",
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,194,26,0.10)" }}>
            <h2 style={{ fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif", fontSize: 22, color: "#fff", margin: 0, letterSpacing: "0.04em" }}>
              Clientes recientes
            </h2>
          </div>
          {loadingClients ? (
            <p style={{ padding: 24, fontSize: 13, color: "#FFC21A" }}>Cargando clientes...</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Nombre", "Apellidos", "Plan", "Inicio", "Fin", "Días"].map((h) => (
                      <th key={h} style={thStyles}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentClients.length > 0 ? (
                    recentClients.map((client) => (
                      <tr
                        key={client.id}
                        style={{ transition: "background 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,194,26,0.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ ...tdStyles, color: "#fff", fontWeight: 600 }}>{client.name}</td>
                        <td style={tdStyles}>{client.lastName}</td>
                        <td style={tdStyles}>{client.plan}</td>
                        <td style={tdStyles}>{client.membershipStartFormatted}</td>
                        <td style={tdStyles}>{client.membershipEndFormatted}</td>
                        <td style={tdStyles}>{client.daysRemaining}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ ...tdStyles, textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 32 }}>
                        No hay clientes disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Products table */}
        <section
          style={{
            background: "#141414",
            border: "1px solid rgba(255,194,26,0.15)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,194,26,0.10)" }}>
            <h2 style={{ fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif", fontSize: 22, color: "#fff", margin: 0, letterSpacing: "0.04em" }}>
              Gestión de productos
            </h2>
          </div>
          {loadingProducts ? (
            <p style={{ padding: 24, fontSize: 13, color: "#FFC21A" }}>Cargando productos...</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Nombre", "Stock"].map((h) => (
                      <th key={h} style={thStyles}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map((product) => (
                      <tr
                        key={product.item_id}
                        style={{ transition: "background 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,194,26,0.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ ...tdStyles, color: "#fff" }}>{product.item_name}</td>
                        <td style={{ ...tdStyles, color: product.item_stock <= 10 ? "#FF7A1A" : "rgba(255,255,255,0.75)" }}>
                          {product.item_stock}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} style={{ ...tdStyles, textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 32 }}>
                        No hay productos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

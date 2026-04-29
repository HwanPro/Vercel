"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Home, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

type Severity = "high" | "medium" | "low";

type ReportData = {
  generatedAt: string;
  overview: {
    totalIncome: number;
    productSales: number;
    newClients: number;
    todayAttendance: number;
    activeMemberships: number;
  };
  trends: {
    incomeTrend: { period: string; total: number }[];
    attendanceTrend: { day: string; count: number }[];
  };
  inventory: {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
  debts: {
    clientsWithDebt: number;
    totalDebt: number;
    dailyDebtsCount: number;
    debtHistoryCount: number;
  };
  distributions: {
    planDistribution: { plan: string; count: number }[];
    topProducts: {
      productId: string;
      name: string;
      revenue: number;
      quantity: number;
    }[];
  };
  dataQuality: {
    score: number;
    issueCount: number;
    inconsistencies: {
      id: string;
      title: string;
      severity: Severity;
      count: number;
      description: string;
      samples: string[];
    }[];
  };
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value ?? 0);
}

function severityStyles(severity: Severity) {
  if (severity === "high") return "border-red-500/60 bg-red-950/40 text-red-200";
  if (severity === "medium")
    return "border-amber-500/60 bg-amber-950/40 text-amber-200";
  return "border-sky-500/60 bg-sky-950/40 text-sky-200";
}

export default function AdminReportes() {
  const router = useRouter();
  const isRedirecting = useRef(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectToLogin = () => {
    if (isRedirecting.current) return;
    isRedirecting.current = true;
    router.replace("/auth/login");
  };

  const fetchReport = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch("/api/admin/reports", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        throw new Error("No se pudieron cargar los reportes");
      }

      const data: ReportData = await response.json();
      setReport(data);
      setError(null);
    } catch (err) {
      console.error("Error cargando reportes:", err);
      setError("No se pudieron cargar los reportes de administración.");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(false);

    const interval = setInterval(() => {
      fetchReport(true);
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const downloadReportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wolf-gym-report-${new Date(report.generatedAt).toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const maxIncome = useMemo(() => {
    if (!report?.trends.incomeTrend.length) return 1;
    return Math.max(...report.trends.incomeTrend.map((item) => item.total), 1);
  }, [report?.trends.incomeTrend]);

  const maxAttendance = useMemo(() => {
    if (!report?.trends.attendanceTrend.length) return 1;
    return Math.max(...report.trends.attendanceTrend.map((item) => item.count), 1);
  }, [report?.trends.attendanceTrend]);

  return (
    <div className="min-h-screen bg-black px-6 text-white">
      <header className="relative flex h-14 items-center bg-black px-4 lg:px-6">
        <Link className="flex items-center justify-center no-underline" href="/">
          <Home className="mr-2 h-6 w-6 text-yellow-400" />
          <span className="text-yellow-400">Inicio</span>
        </Link>
        <nav className="ml-auto flex gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => fetchReport(true)}
            className="inline-flex items-center gap-2 rounded border border-yellow-400 px-3 py-2 text-sm text-yellow-400 hover:bg-yellow-400 hover:text-black"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={downloadReportJson}
            disabled={!report}
            className="rounded border border-zinc-600 px-3 py-2 text-sm text-zinc-200 transition hover:border-yellow-400 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Exportar JSON
          </button>
          <Link
            href="/admin/profile"
            className="rounded border border-yellow-400 px-4 py-2 text-center text-yellow-400 hover:bg-yellow-400 hover:text-black"
          >
            Perfil
          </Link>
          <Link
            href="/admin/dashboard"
            className="rounded bg-yellow-400 px-4 py-2 text-center text-black hover:bg-yellow-500"
          >
            Volver al Dashboard
          </Link>
        </nav>
      </header>

      <main className="pb-12">
        <div className="mb-6 mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">Reportes</h1>
            <p className="text-sm text-zinc-400">
              Vista consolidada de métricas, tendencias e inconsistencias.
            </p>
          </div>
          {report && (
            <p className="text-xs text-zinc-400">
              Generado: {new Date(report.generatedAt).toLocaleString("es-PE")}
            </p>
          )}
        </div>

        {loading && (
          <div className="rounded border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
            Cargando reportes...
          </div>
        )}

        {!loading && error && (
          <div className="rounded border border-red-600/50 bg-red-950/30 p-6 text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && report && (
          <div className="space-y-8">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-400">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatMoney(report.overview.totalIncome)}
                </p>
              </div>
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-400">Ventas de Productos</p>
                <p className="text-2xl font-bold text-orange-400">
                  {formatMoney(report.overview.productSales)}
                </p>
              </div>
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-400">Nuevos Clientes (30d)</p>
                <p className="text-2xl font-bold text-blue-400">{report.overview.newClients}</p>
              </div>
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-400">Asistencia Hoy</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {report.overview.todayAttendance}
                </p>
              </div>
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-400">Calidad de Datos</p>
                <p className="text-2xl font-bold text-cyan-300">
                  {report.dataQuality.score}/100
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="mb-3 text-lg font-bold text-yellow-400">Inventario</h2>
                <div className="space-y-1 text-sm text-zinc-200">
                  <p>Total de productos: {report.inventory.totalProducts}</p>
                  <p>Stock bajo (≤10): {report.inventory.lowStockProducts}</p>
                  <p>Sin stock: {report.inventory.outOfStockProducts}</p>
                </div>
              </div>
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="mb-3 text-lg font-bold text-yellow-400">Deudas</h2>
                <div className="space-y-1 text-sm text-zinc-200">
                  <p>Clientes con deuda: {report.debts.clientsWithDebt}</p>
                  <p>Monto total adeudado: {formatMoney(report.debts.totalDebt)}</p>
                  <p>Registros de deuda diaria: {report.debts.dailyDebtsCount}</p>
                  <p>Registros en historial de deuda: {report.debts.debtHistoryCount}</p>
                </div>
              </div>
            </section>

            <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
              <h2 className="mb-3 text-lg font-bold text-yellow-400">Inconsistencias Detectadas</h2>
              {report.dataQuality.inconsistencies.length === 0 ? (
                <p className="text-sm text-green-300">No se detectaron inconsistencias críticas.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {report.dataQuality.inconsistencies.map((issue) => (
                    <article
                      key={issue.id}
                      className={`rounded border p-3 text-sm ${severityStyles(issue.severity)}`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h3 className="font-semibold">{issue.title}</h3>
                        <span className="rounded border border-current px-2 py-0.5 text-xs uppercase">
                          {issue.severity} · {issue.count}
                        </span>
                      </div>
                      <p className="opacity-90">{issue.description}</p>
                      {issue.samples.length > 0 && (
                        <p className="mt-2 text-xs opacity-80">
                          Muestras: {issue.samples.join(", ")}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="mb-3 text-lg font-bold text-yellow-400">
                  Tendencia de Ingresos (6 meses)
                </h2>
                <div className="space-y-2">
                  {report.trends.incomeTrend.map((point) => (
                    <div key={point.period}>
                      <div className="mb-1 flex justify-between text-xs text-zinc-300">
                        <span>{point.period}</span>
                        <span>{formatMoney(point.total)}</span>
                      </div>
                      <div className="h-2 w-full rounded bg-zinc-800">
                        <div
                          className="h-2 rounded bg-green-500"
                          style={{ width: `${(point.total / maxIncome) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="mb-3 text-lg font-bold text-yellow-400">
                  Asistencia (últimos 14 días)
                </h2>
                <div className="space-y-2">
                  {report.trends.attendanceTrend.map((point) => (
                    <div key={point.day}>
                      <div className="mb-1 flex justify-between text-xs text-zinc-300">
                        <span>{point.day}</span>
                        <span>{point.count}</span>
                      </div>
                      <div className="h-2 w-full rounded bg-zinc-800">
                        <div
                          className="h-2 rounded bg-yellow-500"
                          style={{ width: `${(point.count / maxAttendance) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="mb-3 text-lg font-bold text-yellow-400">
                  Top Productos (por ingresos)
                </h2>
                {report.distributions.topProducts.length === 0 ? (
                  <p className="text-sm text-zinc-400">No hay ventas registradas.</p>
                ) : (
                  <div className="space-y-2">
                    {report.distributions.topProducts.map((product) => (
                      <div
                        key={product.productId}
                        className="flex items-center justify-between rounded border border-zinc-800 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-zinc-400">Cantidad: {product.quantity}</p>
                        </div>
                        <p className="font-semibold text-emerald-300">
                          {formatMoney(product.revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="mb-3 text-lg font-bold text-yellow-400">
                  Distribución de Planes
                </h2>
                {report.distributions.planDistribution.length === 0 ? (
                  <p className="text-sm text-zinc-400">No hay clientes con plan asignado.</p>
                ) : (
                  <div className="space-y-2">
                    {report.distributions.planDistribution.map((plan) => (
                      <div key={plan.plan}>
                        <div className="mb-1 flex justify-between text-xs text-zinc-300">
                          <span>{plan.plan}</span>
                          <span>{plan.count}</span>
                        </div>
                        <div className="h-2 w-full rounded bg-zinc-800">
                          <div
                            className="h-2 rounded bg-blue-500"
                            style={{
                              width: `${(plan.count /
                                Math.max(
                                  ...report.distributions.planDistribution.map((p) => p.count),
                                  1
                                )) *
                                100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

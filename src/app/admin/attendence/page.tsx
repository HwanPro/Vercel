// src/app/admin/attendence/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Download,
  LogIn,
  LogOut,
  QrCode,
  Timer,
  Users,
} from "lucide-react";

type GroupMode = "day" | "month" | "year";

interface Attendance {
  id: string;
  userId: string;
  checkInTime: string;
  checkOutTime?: string;
  durationMins?: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
}

export default function AdminAttendance() {
  const [attendees, setAttendees] = useState<Attendance[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [mode, setMode] = useState<GroupMode>("day");

  // ---- cargar asistencia + reloj ----
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch("/api/attendance", { cache: "no-store" });
        if (!response.ok) throw new Error("Error obteniendo la lista de asistencia.");
        const data: Attendance[] = await response.json();
        setAttendees(data);
      } catch (error) {
        console.error("Error cargando la lista de asistencia:", error);
      }
    };

    setCurrentTime(new Date().toLocaleString());
    fetchAttendance();
    const clock = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 30000);
    const timer = setInterval(() => {
      fetchAttendance();
    }, 60000);

    return () => {
      clearInterval(clock);
      clearInterval(timer);
    };
  }, []);

  // ---- agrupar por día / mes / año ----
  const groups = useMemo(() => {
    const by: Record<string, Attendance[]> = {};
    for (const a of attendees) {
      const d = new Date(a.checkInTime);
      let key: string;
      if (mode === "day") {
        key = d.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" });
      } else if (mode === "month") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = `${d.getFullYear()}`;
      }
      (by[key] ||= []).push(a);
    }

    // Obtener la fecha actual en el mismo formato que la clave
    const today = new Date();
    let todayKey: string;
    if (mode === "day") {
      todayKey = today.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" });
    } else if (mode === "month") {
      todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    } else {
      todayKey = `${today.getFullYear()}`;
    }

    // Ordenar clave descendente, asegurándose de que la fecha actual esté primero si existe
    const ordered = Object.entries(by).sort(([a], [b]) => {
      if (a === todayKey) return -1; // Poner la fecha actual primero
      if (b === todayKey) return 1;
      if (a < b) return 1; // Orden descendente para las demás fechas
      if (a > b) return -1;
      return 0;
    });

    return ordered;
  }, [attendees, mode]);

  const metrics = useMemo(() => {
    const active = attendees.filter((a) => !a.checkOutTime).length;
    const uniqueUsers = new Set(attendees.map((a) => a.userId || a.user?.id)).size;
    const totalMs = attendees.reduce((acc, a) => {
      const checkIn = new Date(a.checkInTime).getTime();
      const checkOut = a.checkOutTime ? new Date(a.checkOutTime).getTime() : Date.now();
      return acc + Math.max(0, checkOut - checkIn);
    }, 0);

    return {
      total: attendees.length,
      active,
      completed: attendees.length - active,
      uniqueUsers,
      totalMs,
    };
  }, [attendees]);


  // ---- util format ----
  const fmtH = (ms: number) => {
    const min = Math.floor(ms / 60000);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  };

  const handleDownloadQR = () => {
    saveAs("/QR-GYM.png", "QR-GYM.png");
    Swal.fire({
      title: "QR Exportado",
      text: "La imagen del código QR ha sido guardada con éxito.",
      icon: "success",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#facc15",
      background: "#000000",
      color: "#ffffff",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 bg-black px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 text-yellow-400">
              <CalendarDays className="h-7 w-7" />
              <h1 className="text-2xl font-black md:text-3xl">Asistencia</h1>
            </div>
            <p className="mt-1 text-sm text-zinc-400">Entradas, salidas y permanencia del gimnasio.</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 py-2.5 font-semibold text-black transition hover:bg-yellow-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 p-4 md:p-8">
        <section className="grid gap-3 md:grid-cols-5">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 md:col-span-2">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Clock3 className="h-4 w-4 text-yellow-400" />
              Hora actual
            </div>
            <div className="mt-3 text-2xl font-black text-white">{currentTime}</div>
          </div>
          <Metric icon={<Users className="h-4 w-4" />} label="Registros" value={metrics.total} />
          <Metric icon={<LogIn className="h-4 w-4" />} label="Activos" value={metrics.active} tone="yellow" />
          <Metric icon={<Timer className="h-4 w-4" />} label="Tiempo total" value={fmtH(metrics.totalMs)} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-yellow-400">Registros</h2>
                <p className="text-sm text-zinc-500">{metrics.uniqueUsers} clientes únicos · {metrics.completed} sesiones cerradas</p>
              </div>
              <div className="inline-flex overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
                {(["day", "month", "year"] as GroupMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-4 py-2 text-sm font-semibold transition ${
                      mode === m
                        ? "bg-yellow-400 text-black"
                        : "text-zinc-300 hover:bg-zinc-900 hover:text-yellow-300"
                    }`}
                  >
                    {m === "day" ? "Día" : m === "month" ? "Mes" : "Año"}
                  </button>
                ))}
              </div>
            </div>

            <section className="space-y-6">
        {groups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
            No hay asistentes aún.
          </div>
        ) : (
          groups.map(([key, list]) => {
            // métricas por bloque
            const total = list.length;
            const totalMs = list.reduce((acc, a) => {
              const ci = new Date(a.checkInTime).getTime();
              const co = a.checkOutTime ? new Date(a.checkOutTime).getTime() : Date.now();
              return acc + Math.max(0, co - ci);
            }, 0);

            return (
              <div key={key} className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                <div className="flex flex-col gap-2 border-b border-zinc-800 bg-black px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-lg font-bold text-yellow-400">
                    {mode === "day" ? `Día ${key}` : mode === "month" ? `Mes ${key}` : `Año ${key}`}
                  </h3>
                  <div className="text-sm text-zinc-400">
                    <span className="mr-4">Registros: <b>{total}</b></span>
                    <span>Tiempo total: <b>{fmtH(totalMs)}</b></span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                        <th className="px-4 py-3">Usuario</th>
                        <th className="px-4 py-3">Día</th>
                        <th className="px-4 py-3">Entrada / salida</th>
                        <th className="px-4 py-3">Estancia</th>
                        <th className="px-4 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((attendee) => {
                        const checkIn = new Date(attendee.checkInTime);
                        const checkOut = attendee.checkOutTime ? new Date(attendee.checkOutTime) : null;
                        const dayOfWeek = checkIn
                          .toLocaleDateString("es-PE", { weekday: "long" })
                          .toUpperCase();
                        const duration =
                          attendee.durationMins != null
                            ? `${attendee.durationMins} min`
                            : checkOut
                            ? `${Math.round((+checkOut - +checkIn) / 60000)} min`
                            : "En curso";

                        return (
                          <tr key={attendee.id} className="border-b border-zinc-900 last:border-0">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-white">{attendee.user.firstName} {attendee.user.lastName}</div>
                              <div className="text-xs text-zinc-500">{attendee.user.phoneNumber}</div>
                            </td>
                            <td className="px-4 py-3 text-zinc-300">{dayOfWeek}</td>
                            <td className="px-4 py-3 text-sm text-zinc-300">
                              <div className="inline-flex items-center gap-2">
                                <LogIn className="h-3.5 w-3.5 text-yellow-400" />
                                {checkIn.toLocaleTimeString()}
                              </div>
                              <br />
                              <div className="mt-1 inline-flex items-center gap-2">
                                <LogOut className="h-3.5 w-3.5 text-red-400" />
                                {checkOut ? checkOut.toLocaleTimeString() : "Pendiente"}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-white">{duration}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
                                checkOut ? "bg-zinc-800 text-zinc-200" : "bg-yellow-400 text-black"
                              }`}>
                                {checkOut ? "Cerrado" : "En curso"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
            </section>
          </div>

          <aside className="h-fit rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-4 flex items-center gap-2 text-yellow-400">
              <QrCode className="h-5 w-5" />
              <h2 className="font-bold">QR de registro</h2>
            </div>
            <div className="rounded-lg bg-white p-3">
              <Image
                src="/uploads/images/QR-GYM.png"
                alt="Código QR de acceso"
                width={220}
                height={220}
                className="mx-auto"
              />
            </div>
            <button
              onClick={handleDownloadQR}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 py-2.5 font-semibold text-black transition hover:bg-yellow-300"
            >
              <Download className="h-4 w-4" />
              Exportar QR
            </button>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  tone?: "default" | "yellow";
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className={`flex items-center gap-2 text-sm ${tone === "yellow" ? "text-yellow-400" : "text-zinc-400"}`}>
        {icon}
        {label}
      </div>
      <div className="mt-3 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

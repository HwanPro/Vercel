// src/app/admin/attendence/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Link from "next/link";

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
  const [hasFp, setHasFp] = useState<Record<string, boolean>>({});
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

    fetchAttendance();
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
      fetchAttendance();
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // ---- estado de huellas por usuario ----
  useEffect(() => {
    const hydrateFp = async () => {
      const entries = await Promise.allSettled(
        attendees.map(async (a) => {
          const uid = a.userId || a.user?.id;
          const r = await fetch(`/api/biometric/status/${uid}`, { cache: "no-store" });
          const j = await r.json().catch(() => ({ hasFingerprint: false }));
          return [uid, !!j?.hasFingerprint] as const;
        })
      );
      const map = Object.fromEntries(
        entries
          .filter((e) => e.status === "fulfilled")
          .map((e) => (e as PromiseFulfilledResult<readonly [string, boolean]>).value)
      );
      setHasFp(map);
    };
    if (attendees.length) hydrateFp();
  }, [attendees]);

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
    <div className="p-6 bg-black min-h-screen text-white">
      {/* HEADER */}
      <header className="flex justify-between items-center border-b border-yellow-400 pb-4">
        <h1 className="text-yellow-400 text-2xl font-bold">Panel de Administrador</h1>
        <Link
          href="/admin/dashboard"
          className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
        >
          Volver al Dashboard
        </Link>
      </header>

      {/* RELOJ + QR */}
      <section className="my-6 grid gap-6">
        <div className="text-center border border-yellow-400/40 rounded-xl p-4">
          <h3 className="text-3xl text-yellow-400 font-bold">Hora Actual</h3>
          <p className="text-2xl text-white mt-2">{currentTime}</p>
        </div>

        <div className="text-center border border-yellow-400/40 rounded-xl p-4">
          <h3 className="text-2xl text-yellow-400">Código QR de Registro</h3>
          <div className="flex flex-col items-center">
            <Image
              src="/uploads/images/QR-GYM.png"
              alt="Código QR de acceso"
              width={200}
              height={200}
              className="mx-auto border border-yellow-400 p-2 bg-white"
            />
            <button
              onClick={handleDownloadQR}
              className="mt-4 bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
            >
              Exportar QR
            </button>
          </div>
        </div>
      </section>

      {/* CONTROLES DE AGRUPACIÓN */}
      <section className="mb-4">
        <div className="inline-flex rounded-xl overflow-hidden border border-yellow-400/60">
          {(["day", "month", "year"] as GroupMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm ${
                mode === m
                  ? "bg-yellow-400 text-black"
                  : "bg-transparent text-yellow-400 hover:bg-yellow-500 hover:text-black"
              }`}
            >
              {m === "day" ? "Día" : m === "month" ? "Mes" : "Año"}
            </button>
          ))}
        </div>
      </section>

      {/* BLOQUES AGRUPADOS */}
      <section className="space-y-8">
        {groups.length === 0 ? (
          <div className="text-center p-4 text-gray-400 border border-yellow-400/40 rounded-xl">
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
              <div key={key} className="border border-yellow-400/40 rounded-xl overflow-hidden">
                <div className="bg-yellow-400/10 px-4 py-3 flex items-center justify-between">
                  <h3 className="text-xl text-yellow-400 font-semibold">
                    {mode === "day" ? `Día ${key}` : mode === "month" ? `Mes ${key}` : `Año ${key}`}
                  </h3>
                  <div className="text-sm text-yellow-400/90">
                    <span className="mr-4">Registros: <b>{total}</b></span>
                    <span>Tiempo total: <b>{fmtH(totalMs)}</b></span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-yellow-400 text-black">
                        <th className="p-2">Usuario</th>
                        <th className="p-2">Día</th>
                        <th className="p-2">Entradas y Salidas</th>
                        <th className="p-2">Estancia</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((attendee) => {
                        const checkIn = new Date(attendee.checkInTime);
                        const checkOut = attendee.checkOutTime ? new Date(attendee.checkOutTime) : null;
                        const dayOfWeek = checkIn
                          .toLocaleDateString("es-PE", { weekday: "long" })
                          .toUpperCase();
                        const uid = attendee.userId || attendee.user?.id;
                        const duration =
                          attendee.durationMins != null
                            ? `${attendee.durationMins} min`
                            : checkOut
                            ? `${Math.round((+checkOut - +checkIn) / 60000)} min`
                            : "En curso";

                        return (
                          <tr key={attendee.id} className="border-b border-gray-600">
                            <td className="p-2">
                              {attendee.user.firstName} {attendee.user.lastName}
                            </td>
                            <td className="p-2">{dayOfWeek}</td>
                            <td className="p-2">
                              Entrada: {checkIn.toLocaleTimeString()} <br />
                              {checkOut ? `Salida: ${checkOut.toLocaleTimeString()}` : "Sin salida"}
                            </td>
                            <td className="p-2">{duration}</td>
                            <td className="p-2">
                              
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
  );
}
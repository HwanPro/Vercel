// src/app/admin/attendence/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Link from "next/link";

interface Attendance {
  id: string; // id del registro de asistencia
  userId: string; // <-- AÑADIDO: id del usuario (FK a users.id)
  checkInTime: string;
  checkOutTime?: string;
  durationMins?: number;
  user: {
    id: string; // <-- AÑADIDO
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
}

export default function AdminDashboard() {
  const [attendees, setAttendees] = useState<Attendance[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [hasFp, setHasFp] = useState<Record<string, boolean>>({});

  // Cargar estado de huella por usuario (no por asistencia)
  useEffect(() => {
    const hydrateFp = async () => {
      const entries = await Promise.allSettled(
        attendees.map(async (a) => {
          const uid = a.userId || a.user?.id; // fallback
          const r = await fetch(`/api/biometric/status/${uid}`, {
            cache: "no-store",
          });
          const j = await r.json().catch(() => ({ hasFingerprint: false }));
          return [uid, !!j?.hasFingerprint] as const;
        })
      );
      const map = Object.fromEntries(
        entries
          .filter((e) => e.status === "fulfilled")
          .map(
            (e) =>
              (e as PromiseFulfilledResult<readonly [string, boolean]>).value
          )
      );
      setHasFp(map);
    };
    if (attendees.length) hydrateFp();
  }, [attendees]);

  // Cargar asistencia y refrescar reloj
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch("/api/attendance", { cache: "no-store" });
        if (!response.ok)
          throw new Error("Error obteniendo la lista de asistencia.");
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

  // Ahora recibe userId (no el id de asistencia)
  const handleRegisterFingerprint = async (userId: string) => {
    if (busy[userId]) return;
    setBusy((b) => ({ ...b, [userId]: true }));

    const swalBase = {
      background: "#000",
      color: "#fff",
      confirmButtonColor: "#facc15",
    };

    // helper: una captura
    const captureOnce = async () => {
      const r = await fetch("/api/biometric/capture", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok || !j?.template) {
        throw new Error(j?.message || "No se pudo capturar la huella");
      }
      return j.template as string;
    };

    try {
      // ¿Ya tiene huella?
      const st = await fetch(`/api/biometric/status/${userId}`, {
        cache: "no-store",
      });
      const sj = await st.json().catch(() => ({ hasFingerprint: false }));
      if (sj?.hasFingerprint) {
        const q = await Swal.fire({
          ...swalBase,
          title: "Reemplazar huella",
          text: "Este usuario ya tiene una huella registrada. ¿Deseas reemplazarla?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, reemplazar",
          cancelButtonText: "Cancelar",
        });
        if (!q.isConfirmed) return;
      }

      const templates: string[] = [];

      // 3 capturas con guía visual
      for (let i = 1; i <= 3; i++) {
        await Swal.fire({
          ...swalBase,
          title: `Coloca tu dedo (${i}/3)`,
          text:
            i === 1
              ? "Manténlo firme hasta que termine"
              : "Retira y vuelve a colocar",
          icon: "info",
          timer: 900,
          showConfirmButton: false,
          allowOutsideClick: false,
        });

        Swal.fire({
          ...swalBase,
          title: `Capturando (${i}/3)…`,
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => Swal.showLoading(),
        });

        try {
          const tpl = await captureOnce();
          templates.push(tpl);
        } catch (e: Error | unknown) {
          return Swal.fire({
            ...swalBase,
            title: "Error en captura",
            text: (e as Error)?.message || "No se pudo capturar la huella",
            icon: "error",
          });
        }

        await Swal.fire({
          ...swalBase,
          title: "Muestra capturada",
          timer: 500,
          showConfirmButton: false,
        });
      }

      // Guardar (multi)
      Swal.fire({
        ...swalBase,
        title: "Guardando huella…",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch(`/api/biometric/register/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates }), // ← enviamos 3 muestras
      });
      const jr = await res.json().catch(() => ({}));

      if (!res.ok || !jr?.ok) {
        return Swal.fire({
          ...swalBase,
          title: "Error en registro",
          text: jr?.message || "No se pudo registrar",
          icon: "error",
        });
      }

      setHasFp((m) => ({ ...m, [userId]: true }));

      return Swal.fire({
        ...swalBase,
        title: jr?.message || "Huella registrada",
        icon: "success",
        timer: 1100,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error(e);
      return Swal.fire({
        ...swalBase,
        title: "Error",
        text: "No se pudo registrar la huella",
        icon: "error",
      });
    } finally {
      setBusy((b) => ({ ...b, [userId]: false }));
    }
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <header className="flex justify-between items-center border-b border-yellow-400 pb-4">
        <h1 className="text-yellow-400 text-2xl font-bold">
          Panel de Administrador
        </h1>
        <Link
          href="/admin/dashboard"
          className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
        >
          Volver al Dashboard
        </Link>
      </header>

      <section className="my-6 text-center">
        <h3 className="text-3xl text-yellow-400 font-bold">Hora Actual</h3>
        <p className="text-2xl text-white mt-2">{currentTime}</p>
      </section>

      <section className="my-6 text-center">
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
      </section>

      {/* Lista de Asistentes */}
      <section className="my-6">
        <h3 className="text-2xl text-yellow-400">Asistentes Registrados</h3>
        <p className="text-lg text-gray-400">
          Total: {attendees.length} personas
        </p>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-yellow-400 text-black">
                <th className="p-2">Usuario</th>
                <th className="p-2">Día</th>
                <th className="p-2">Entradas y Salidas</th>
                <th className="p-2">Estancia</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {attendees.length > 0 ? (
                attendees.map((attendee) => {
                  const checkIn = new Date(attendee.checkInTime);
                  const checkOut = attendee.checkOutTime
                    ? new Date(attendee.checkOutTime)
                    : null;
                  const dayOfWeek = checkIn
                    .toLocaleDateString("es-PE", { weekday: "long" })
                    .toUpperCase();
                  const uid = attendee.userId || attendee.user?.id;

                  return (
                    <tr key={attendee.id} className="border-b border-gray-600">
                      <td className="p-2">
                        {attendee.user.firstName} {attendee.user.lastName}
                      </td>
                      <td className="p-2">{dayOfWeek}</td>
                      <td className="p-2">
                        Entrada: {checkIn.toLocaleTimeString()} <br />
                        {checkOut
                          ? `Salida: ${checkOut.toLocaleTimeString()}`
                          : "Sin salida"}
                      </td>
                      <td className="p-2">
                        {attendee.durationMins != null
                          ? `${attendee.durationMins} min`
                          : "En curso"}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleRegisterFingerprint(uid)}
                            disabled={!!busy[uid]}
                            className={`px-3 py-1 rounded text-sm ${
                              busy[uid]
                                ? "opacity-50 cursor-not-allowed bg-yellow-400 text-black"
                                : "bg-yellow-400 text-black hover:bg-yellow-500"
                            }`}
                          >
                            {hasFp[uid]
                              ? "Reemplazar huella"
                              : "Registrar huella"}
                          </button>

                          <button
                            onClick={async () => {
                              if (busy[uid]) return;
                              setBusy((b) => ({ ...b, [uid]: true }));
                              const swalBase = {
                                background: "#000",
                                color: "#fff",
                                confirmButtonColor: "#facc15",
                              };
                              try {
                                await Swal.fire({
                                  ...swalBase,
                                  title: "Coloca tu dedo en el lector",
                                  text: "Manténlo hasta que termine la verificación",
                                  icon: "info",
                                  timer: 900,
                                  showConfirmButton: false,
                                });
                                Swal.fire({
                                  ...swalBase,
                                  title: "Verificando huella...",
                                  allowOutsideClick: false,
                                  showConfirmButton: false,
                                  didOpen: () => Swal.showLoading(),
                                });
                                // dentro del onClick de "Verificar"
                                const res = await fetch(
                                  `/api/biometric/verify/${uid}`,
                                  { method: "POST" }
                                );
                                const data = await res.json().catch(() => ({}));

                                const isError =
                                  data?.ok === false &&
                                  typeof data?.score === "number" &&
                                  data.score < 0;
                                const baseMsg = data?.message ?? "";
                                const extra = Number.isFinite(data?.score)
                                  ? ` (score=${data.score}, thr=${data?.threshold ?? "?"})`
                                  : "";

                                await Swal.fire({
                                  ...swalBase,
                                  title: data?.match
                                    ? "Huella verificada"
                                    : isError
                                      ? "Error del lector"
                                      : "No coincide",
                                  text: `${baseMsg}${extra}`,
                                  icon: data?.match
                                    ? "success"
                                    : isError
                                      ? "error"
                                      : "error",
                                  timer: 1300,
                                  showConfirmButton: false,
                                });
                              } finally {
                                setBusy((b) => ({ ...b, [uid]: false }));
                              }
                            }}
                            disabled={!!busy[uid]}
                            className={`px-3 py-1 rounded text-sm border ${
                              busy[uid]
                                ? "opacity-50 cursor-not-allowed border-yellow-400 text-yellow-400"
                                : "border-yellow-400 text-yellow-400 hover:bg-yellow-500 hover:text-black"
                            }`}
                          >
                            Verificar
                          </button>
                          <button
                            onClick={async () => {
                              const { value } = await Swal.fire({
                                background: "#000",
                                color: "#fff",
                                confirmButtonColor: "#facc15",
                                title: "Corregir horarios",
                                html: `
        <div style="display:grid;gap:8px;text-align:left">
          <label>Check-in (ISO): <input id="cin" type="datetime-local"></label>
          <label>Check-out (ISO): <input id="cout" type="datetime-local"></label>
          <label>Tipo:
            <select id="typ">
              <option value="gym">gym</option>
              <option value="fullbody">fullbody</option>
            </select>
          </label>
        </div>`,
                                focusConfirm: false,
                                preConfirm: () => ({
                                  checkInTime:
                                    (
                                      document.getElementById(
                                        "cin"
                                      ) as HTMLInputElement
                                    )?.value || null,
                                  checkOutTime:
                                    (
                                      document.getElementById(
                                        "cout"
                                      ) as HTMLInputElement
                                    )?.value || null,
                                  type:
                                    (
                                      document.getElementById(
                                        "typ"
                                      ) as HTMLSelectElement
                                    )?.value || "gym",
                                }),
                              });
                              if (!value) return;
                              await fetch(`/api/attendance/${attendee.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(value),
                              });
                              // refrescar lista
                            }}
                            className="border border-yellow-400 text-yellow-400 px-3 py-1 rounded hover:bg-yellow-500 hover:text-black"
                          >
                            Corregir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center p-4 text-gray-400">
                    No hay asistentes aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Link from "next/link";

interface Attendance {
  id: string;
  checkInTime: string;
  checkOutTime?: string;
  durationMins?: number;
  user: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
}

export default function AdminDashboard() {
  const [attendees, setAttendees] = useState<Attendance[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch("/api/attendance");
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
    }, 10000); // Ahora se actualiza cada 10 segundos en lugar de 5

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

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      {/* Header */}
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

      {/* Contador de Fecha y Hora */}
      <section className="my-6 text-center">
        <h3 className="text-3xl text-yellow-400 font-bold">Hora Actual</h3>
        <p className="text-2xl text-white mt-2">{currentTime}</p>
      </section>

      {/* QR Estático */}
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
              </tr>
            </thead>

            <tbody>
              {attendees.length > 0 ? (
                attendees.map((attendee) => {
                  const checkIn = new Date(attendee.checkInTime);
                  const checkOut = attendee.checkOutTime
                    ? new Date(attendee.checkOutTime)
                    : null;

                  const dayOfWeek = checkIn.toLocaleDateString("es-PE", {
                    weekday: "long",
                  });

                  return (
                    <tr key={attendee.id} className="border-b border-gray-600">
                      <td className="p-2">
                        {attendee.user.firstName} {attendee.user.lastName}
                      </td>
                      <td className="p-2">{dayOfWeek.toUpperCase()}</td>
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
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center p-4 text-gray-400">
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

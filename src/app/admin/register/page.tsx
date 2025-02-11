"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Link from "next/link";

interface Attendance {
  id: string;
  userId: string;
  checkInTime: string;
}

export default function AdminDashboard() {
  const [attendees, setAttendees] = useState<Attendance[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("");
  const qrRef = useRef<HTMLCanvasElement | null>(null);

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
      fetchAttendance(); // Refresca la lista de asistentes en tiempo real
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleDownloadQR = () => {
    if (qrRef.current) {
      const canvas = qrRef.current as HTMLCanvasElement;
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `QR-GYM.png`);
          Swal.fire({
            title: "QR Exportado",
            text: "La imagen del código QR ha sido guardada con éxito.",
            icon: "success",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#facc15",
            background: "#000000",
            color: "#ffffff",
          });
        }
      });
    }
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

      {/* QR Único para Todos */}
      <section className="my-6 text-center">
        <h3 className="text-2xl text-yellow-400">Código QR de Registro</h3>
        <div className="flex flex-col items-center">
          <QRCodeCanvas
            value="gym-attendance-2025"
            size={200}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            ref={qrRef}
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
                <th className="p-2">ID Usuario</th>
                <th className="p-2">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody>
              {attendees.length > 0 ? (
                attendees.map((attendee) => (
                  <tr key={attendee.id} className="border-b border-gray-600">
                    <td className="p-2">{attendee.userId}</td>
                    <td className="p-2">
                      {new Date(attendee.checkInTime).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="text-center p-4 text-gray-400">
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

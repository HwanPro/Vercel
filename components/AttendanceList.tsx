// components/AttendanceList.tsx
"use client";
import React, { useState, useEffect } from "react";

interface Attendance {
  date: string;
  time: string;
}

const AttendanceList: React.FC = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);

  useEffect(() => {
    // Fetch attendances (esto debe ser configurado con un backend real)
    const fetchAttendances = async () => {
      const response = await fetch("/api/attendances");
      if (response.ok) {
        const data = await response.json();
        setAttendances(data);
      }
    };
    fetchAttendances();
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-xl text-yellow-400 font-semibold">Historial de Asistencias</h3>
      {attendances.length === 0 ? (
        <p className="text-gray-500">No se ha registrado ninguna asistencia.</p>
      ) : (
        <ul className="mt-4">
          {attendances.map((attendance, index) => (
            <li key={index} className="text-white">
              {attendance.date} - {attendance.time}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AttendanceList;

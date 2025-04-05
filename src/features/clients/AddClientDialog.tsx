"use client";

import { useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Button } from "@/ui/button";
import "react-toastify/dist/ReactToastify.css";
import MembershipSelection from "@/ui/components/MembershipSelection";

interface Client {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  plan: string;
  membershipStart: string;
  membershipEnd: string;
  phone: string;
  emergencyPhone: string;
  address: string;
  social: string;
  hasPaid: boolean;
  password?: string;
}

export default function AddClientDialog({
  onSave,
  onCredentialsUpdate, // callback opcional para actualizar en la misma pestaña
}: {
  onSave: (client: Omit<Client, "id">) => void;
  onCredentialsUpdate?: (cred: {
    username: string;
    password: string;
    phone: string;
  }) => void;
}) {
  // Estados para los campos
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [membershipStart, setMembershipStart] = useState<string>("");
  const [membershipEnd, setMembershipEnd] = useState<string>("");

  const [address, setAddress] = useState("");
  const [social, setSocial] = useState("");

  const [manualDates, setManualDates] = useState<boolean>(false);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [emergencyPhone, setEmergencyPhone] = useState<string | undefined>(
    undefined
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Estado para mostrar las credenciales generadas en el modal
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
    phone: string;
  } | null>(null);

  const handleSave = async () => {
    setErrorMessage("");

    if (!name || !lastName || !phone) {
      setErrorMessage("Por favor, complete los campos obligatorios.");
      return;
    }

    // Validar fechas
    if (membershipStart && membershipEnd) {
      const startDateObj = new Date(membershipStart);
      const endDateObj = new Date(membershipEnd);
      if (startDateObj >= endDateObj) {
        setErrorMessage(
          "La fecha de inicio debe ser anterior a la fecha de fin."
        );
        return;
      }
    }

    if (!isValidPhoneNumber(phone)) {
      setErrorMessage("El número de teléfono principal no es válido.");
      return;
    }
    if (emergencyPhone && !isValidPhoneNumber(emergencyPhone)) {
      setErrorMessage("El número de emergencia no es válido.");
      return;
    }

    // Generar el username a partir de los nombres
    const generatedUsername = `${name.trim().toLowerCase()}.${lastName.trim().toLowerCase()}`;

    // Armar el objeto a enviar, sin password
    const newClientData = {
      username: generatedUsername,
      firstName: name.trim(),
      lastName: lastName.trim(),
      plan: plan || "Mensual",
      membershipStart,
      membershipEnd,
      phone: phone!,
      emergencyPhone: emergencyPhone || "",
      address,
      social,
      hasPaid: false,
    };

    try {
      setLoading(true);
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newClientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(
          errorData.error ||
            "No se pudo guardar el cliente. Intente nuevamente."
        );
        setLoading(false);
        return;
      }

      // Extraer la respuesta del backend, que incluye la contraseña temporal en tempPassword
      const result = await response.json();
      const tempPassword = result.tempPassword;

  

      // Armar el objeto credencial usando el valor retornado por el backend
      const cred = {
        username: generatedUsername,
        password: tempPassword,
        phone: phone!,
      };

      // Guardar en localStorage
      const stored = localStorage.getItem("pendingCredentials");
      const list = stored ? JSON.parse(stored) : [];
      list.push(cred);
      localStorage.setItem("pendingCredentials", JSON.stringify(list));

      // Actualizar el estado local para mostrar el modal (y opcionalmente notificar a ClientsPage)
      setCredentials(cred);
      if (onCredentialsUpdate) {
        onCredentialsUpdate(cred);
      }

      // Llamar onSave para actualizar la lista de clientes en el panel
      onSave({
        ...newClientData,
        userName: generatedUsername,
        password: tempPassword,
      });
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      setErrorMessage("No se pudo guardar el cliente. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative p-4 bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
      {errorMessage && (
        <p className="text-red-500 mb-2 text-sm">{errorMessage}</p>
      )}

      {/* Nombres */}
      <input
        className="w-full p-2 mb-2 border rounded bg-white text-black text-sm"
        placeholder="Nombres"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* Apellidos */}
      <input
        className="w-full p-2 mb-2 border rounded bg-white text-black text-sm"
        placeholder="Apellidos"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />

      {/* Dirección */}
      <input
        className="w-full p-2 mb-2 border rounded bg-white text-black text-sm"
        placeholder="Dirección (opcional)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      {/* Red Social */}
      <input
        className="w-full p-2 mb-2 border rounded bg-white text-black text-sm"
        placeholder="Red social (opcional)"
        value={social}
        onChange={(e) => setSocial(e.target.value)}
      />

      {/* Selección de membresía */}
      <MembershipSelection
        onPlanSelect={(selectedPlan, start, end) => {
          setPlan(selectedPlan);
          setMembershipStart(start);
          setMembershipEnd(end);
        }}
      />

      {/* Fechas manuales */}
      <label className="flex items-center gap-2 text-black text-sm mt-4">
        <input
          type="checkbox"
          checked={manualDates}
          onChange={() => setManualDates(!manualDates)}
        />
        Ingresar fechas manualmente
      </label>

      {manualDates && (
        <>
          <label className="block text-sm font-bold mb-1 text-black">
            Fecha de inicio
          </label>
          <input
            type="date"
            className="w-full p-2 mb-2 border rounded bg-white text-black text-sm"
            value={membershipStart}
            onChange={(e) => setMembershipStart(e.target.value)}
          />
          <label className="block text-sm font-bold mb-1 text-black">
            Fecha de fin
          </label>
          <input
            type="date"
            className="w-full p-2 mb-2 border rounded bg-white text-black text-sm"
            value={membershipEnd}
            onChange={(e) => setMembershipEnd(e.target.value)}
          />
        </>
      )}

      {/* Teléfono principal */}
      <PhoneInput
        defaultCountry="PE"
        placeholder="Teléfono principal"
        value={phone}
        onChange={setPhone}
        className="w-full p-2 mb-2 border rounded bg-white text-black text-sm"
      />

      {/* Teléfono de emergencia */}
      <PhoneInput
        defaultCountry="PE"
        placeholder="Teléfono de emergencia (opcional)"
        value={emergencyPhone}
        onChange={setEmergencyPhone}
        className="w-full p-2 mb-2 border rounded bg-white text-black text-sm"
      />

      <Button
        className="bg-yellow-400 text-black hover:bg-yellow-500 w-full text-sm"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "Guardando..." : "Guardar Cliente"}
      </Button>

      {/* Modal con credenciales */}
      {credentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-center">
              ¡Bienvenido al sistema!
            </h2>
            <p className="mb-4 text-center italic">
              &ldquo;El éxito es la suma de pequeños esfuerzos repetidos día
              tras día.&rdquo;
            </p>
            <div className="mb-4">
              <p>
                <span className="font-bold">Usuario:</span>{" "}
                {credentials.username}
              </p>
              <p>
                <span className="font-bold">Contraseña:</span>{" "}
                {credentials.password}
              </p>
            </div>
            <Button
              className="bg-green-600 text-white w-full mb-2"
              onClick={() => {
                window.open(`https://wa.me/${credentials.phone}`, "_blank");
              }}
            >
              Abrir chat en WhatsApp
            </Button>
            <Button
              className="bg-yellow-400 text-black w-full"
              onClick={() => {
                setCredentials(null);
                // Opcional: limpiar campos si lo deseas
              }}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

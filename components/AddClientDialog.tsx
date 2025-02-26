"use client";

import { useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Button } from "./ui/button";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MembershipSelection from "@/components/MembershipSelection"; // Importamos el componente

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  plan: string;
  membershipStart: string;
  membershipEnd: string;
  phone: string;
  emergencyPhone: string;
  hasPaid: boolean;
  password?: string;
}

export default function AddClientDialog({
  onSave,
}: {
  onSave: (client: Omit<Client, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [membershipStart, setMembershipStart] = useState<string>("");
  const [membershipEnd, setMembershipEnd] = useState<string>("");
  const [manualDates, setManualDates] = useState<boolean>(false);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [emergencyPhone, setEmergencyPhone] = useState<string | undefined>(
    undefined
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const generateRandomPassword = (length = 12) => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  const handleSave = async () => {
    setErrorMessage("");
    

    if (
      !name ||
      !lastName ||
      !email ||
      !membershipStart ||
      !membershipEnd ||
      !phone
    ) {
      setErrorMessage("Por favor, complete todos los campos obligatorios.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage("El correo electrónico no es válido.");
      return;
    }

    const startDateObj = new Date(membershipStart);
    const endDateObj = new Date(membershipEnd);
    if (startDateObj >= endDateObj) {
      setErrorMessage(
        "La fecha de inicio debe ser anterior a la fecha de fin."
      );
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      setErrorMessage("El número de teléfono principal no es válido.");
      return;
    }

    // Validar el teléfono de emergencia solo si se ingresa algún valor
    if (emergencyPhone && !isValidPhoneNumber(emergencyPhone)) {
      setErrorMessage("El número de emergencia no es válido.");
      return;
    }

    if (paymentMethod === "Tarjeta") {
      alert("Por favor, complete el pago en el POS.");
      return;
    }
    if (paymentMethod === "Billetera") {
      alert("Por favor, confirme el pago escaneando el QR.");
      return;
    }

    const generatedPassword = generateRandomPassword(12);

    const newClientData = {
      firstName: name.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      plan: plan || "",
      membershipStart,
      membershipEnd,
      phone: phone!,
      emergencyPhone: emergencyPhone !,
      hasPaid: true,
      password: generatedPassword,
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

      toast.success("Cliente agregado con éxito.");
      onSave(newClientData);
      setName("");
      setLastName("");
      setEmail("");
      setPlan(null);
      setMembershipStart("");
      setMembershipEnd("");
      setPhone(undefined);
      setEmergencyPhone(undefined);
      setPaymentMethod("Efectivo");
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

      <input
        className="w-full p-2 mb-2 border rounded bg-white text-black text-sm"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full p-2 mb-2 border rounded bg-white text-black text-sm"
        placeholder="Apellidos"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <input
        className="w-full p-2 mb-2 border rounded bg-white text-black text-sm"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <MembershipSelection
        onPlanSelect={(selectedPlan, start, end) => {
          setPlan(selectedPlan);
          setMembershipStart(start);
          setMembershipEnd(end);
        }}
      />

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

      <PhoneInput
        defaultCountry="PE"
        placeholder="Teléfono principal"
        value={phone}
        onChange={setPhone}
        className="w-full p-2 mb-2 border rounded bg-white text-black text-sm"
      />
      <PhoneInput
        defaultCountry="PE"
        placeholder="Teléfono de emergencia"
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
    </div>
  );
}

import { useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Button } from "./ui/button";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

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
}

export default function AddClientDialog({
  onSave,
}: {
  onSave: (client: Omit<Client, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("Mensual");
  const [membershipStart, setMembershipStart] = useState("");
  const [membershipEnd, setMembershipEnd] = useState("");
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [emergencyPhone, setEmergencyPhone] = useState<string | undefined>(
    undefined
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const qrImageURL = "https://example.com/qr"; // URL del QR de ejemplo

  const handleSave = async () => {
    setErrorMessage("");

    if (
      !name ||
      !lastName ||
      !email ||
      !membershipStart ||
      !membershipEnd ||
      !phone ||
      !emergencyPhone
    ) {
      setErrorMessage("Por favor, complete todos los campos.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage("El correo electrónico no es válido.");
      return;
    }

    const startDate = new Date(membershipStart);
    const endDate = new Date(membershipEnd);
    if (startDate >= endDate) {
      setErrorMessage(
        "La fecha de inicio debe ser anterior a la fecha de fin."
      );
      return;
    }

    if (!isValidPhoneNumber(phone || "")) {
      setErrorMessage("El número de teléfono principal no es válido.");
      return;
    }

    if (!isValidPhoneNumber(emergencyPhone || "")) {
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

    const newClientData = {
      firstName: name.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      plan,
      startDate: membershipStart,
      endDate: membershipEnd,
      phone: phone!,
      emergencyPhone: emergencyPhone!,
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
      setName("");
      setLastName("");
      setEmail("");
      setPlan("Mensual");
      setMembershipStart("");
      setMembershipEnd("");
      setPhone(undefined);
      setEmergencyPhone(undefined);
      setPaymentMethod("Efectivo");
      setLoading(false);
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      setErrorMessage("No se pudo guardar el cliente. Intente nuevamente.");
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

      <select
        className="w-full p-2 mb-2 border rounded bg-white text-black text-sm"
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
      >
        <option value="Mensual">Mensual</option>
        <option value="Promoción Básica">Promoción Básica</option>
        <option value="Promoción Premium">Promoción Premium</option>
        <option value="Promoción VIP">Promoción VIP</option>
      </select>

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

      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        className="w-full p-2 mb-2 border rounded text-sm"
      >
        <option value="Efectivo">Efectivo</option>
        <option value="Tarjeta">Tarjeta</option>
        <option value="Billetera">Billetera Virtual</option>
      </select>

      {paymentMethod === "Billetera" && (
        <div className="flex justify-center mb-2">
          <Image
            src={qrImageURL}
            alt="QR Pago"
            width={120}
            height={120}
            className="mb-2"
          />
        </div>
      )}

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

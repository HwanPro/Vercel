import { useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Button } from "./ui/button";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
  const [emergencyPhone, setEmergencyPhone] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const qrImageURL = "https://example.com/qr"; // URL del QR de ejemplo

  const handleSave = async () => {
    setErrorMessage("");

    // Validación de campos vacíos
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

    // Validar formato del email
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage("El correo electrónico no es válido.");
      return;
    }

    // Validación de fechas
    const startDate = new Date(membershipStart);
    const endDate = new Date(membershipEnd);
    if (startDate >= endDate) {
      setErrorMessage("La fecha de inicio debe ser anterior a la fecha de fin.");
      return;
    }

    // Validar teléfonos
    if (!isValidPhoneNumber(phone || "")) {
      setErrorMessage("El número de teléfono principal no es válido.");
      return;
    }

    if (!isValidPhoneNumber(emergencyPhone || "")) {
      setErrorMessage("El número de emergencia no es válido.");
      return;
    }

    // Validación del método de pago
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

      // Hacer POST al endpoint /api/clients
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Importante para enviar cookies y mantener sesión
        body: JSON.stringify(newClientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.error || "No se pudo guardar el cliente. Intente nuevamente.");
        setLoading(false);
        return;
      }

      // Si todo va bien, notificar éxito y resetear campos
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
    <div className="relative p-6 bg-white rounded-lg shadow-lg w-96">
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

      <input
        className="w-full p-2 mb-4 border rounded bg-white text-black placeholder-gray-500"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full p-2 mb-4 border rounded bg-white text-black placeholder-gray-500"
        placeholder="Apellidos"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <input
        className="w-full p-2 mb-4 border rounded bg-white text-black placeholder-gray-500"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <select
        className="w-full p-2 mb-4 border rounded bg-white text-black"
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
      >
        <option value="Mensual">Mensual</option>
        <option value="Promoción Básica">Promoción Básica</option>
        <option value="Promoción Premium">Promoción Premium</option>
        <option value="Promoción VIP">Promoción VIP</option>
      </select>

      <label className="block text-sm font-bold mb-1 text-black">
        Fecha de inicio de membresía
      </label>
      <input
        type="date"
        className="w-full p-2 mb-4 border rounded bg-white text-black"
        value={membershipStart}
        onChange={(e) => setMembershipStart(e.target.value)}
      />
      <label className="block text-sm font-bold mb-1 text-black">
        Fecha de fin de membresía
      </label>
      <input
        type="date"
        className="w-full p-2 mb-4 border rounded bg-white text-black"
        value={membershipEnd}
        onChange={(e) => setMembershipEnd(e.target.value)}
      />

      <PhoneInput
        defaultCountry="PE"
        placeholder="Número de teléfono principal"
        value={phone}
        onChange={setPhone}
        className="w-full p-2 mb-4 border rounded bg-white text-black"
      />
      <PhoneInput
        defaultCountry="PE"
        placeholder="Número de emergencia"
        value={emergencyPhone}
        onChange={setEmergencyPhone}
        className="w-full p-2 mb-4 border rounded bg-white text-black"
      />

      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      >
        <option value="Efectivo">Efectivo</option>
        <option value="Tarjeta">Tarjeta</option>
        <option value="Billetera">Billetera Virtual</option>
      </select>
      {paymentMethod === "Tarjeta" && (
        <Button onClick={() => alert("Ir a POS")}>Ir a POS</Button>
      )}
      {paymentMethod === "Billetera" && <img src={qrImageURL} alt="QR Pago" />}

      <Button
        className="bg-yellow-400 text-black hover:bg-yellow-500 w-full"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "Guardando..." : "Guardar Cliente"}
      </Button>
    </div>
  );
}

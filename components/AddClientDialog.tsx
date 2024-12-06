import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useState } from "react";
import { Button } from "./ui/button";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  plan: string;
  membershipStart: string;
  membershipEnd: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  hasPaid: boolean;
}


export default function AddClientDialog({
  onSave,
}: {
  onSave: (client: Omit<Client, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [plan, setPlan] = useState("Básico");
  const [membershipStart, setMembershipStart] = useState("");
  const [membershipEnd, setMembershipEnd] = useState("");
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [emergencyPhone, setEmergencyPhone] = useState<string | undefined>(
    undefined
  );
  const [email, setEmail] = useState("");
  const [hasPaid, setHasPaid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = () => {
    if (
      !name ||
      !lastName ||
      !membershipStart ||
      !membershipEnd ||
      !phone ||
      !emergencyPhone ||
      !email ||
      hasPaid === null
    ) {
      setErrorMessage("Por favor, complete todos los campos.");
      return;
    }

    if (!isValidPhoneNumber(phone) || !isValidPhoneNumber(emergencyPhone)) {
      setErrorMessage("Por favor, ingrese números de teléfono válidos.");
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
    const newClient: Omit<Client, "id"> = {
      firstName: name,
      lastName: lastName,
      plan: plan,
      membershipStart: membershipStart,
      membershipEnd: membershipEnd,
      phone: phone,
      emergencyPhone: emergencyPhone,
      email: email,
      hasPaid: hasPaid!,
    };
    

    try {
      onSave(newClient);

      setName("");
      setLastName("");
      setPlan("Básico");
      setMembershipStart("");
      setMembershipEnd("");
      setPhone(undefined);
      setEmergencyPhone(undefined);
      setEmail("");
      setHasPaid(null);
      setErrorMessage("");
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      setErrorMessage("No se pudo guardar el cliente. Intente nuevamente.");
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
        type="email"
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
        <option value="Básico">Mensual</option>
        <option value="Promoción Básica">Promoción Básica</option>
        <option value="Promoción Premium">Promoción Premium</option>
        <option value="Promoción VIP">Promoción VIP</option>
      </select>
      <label className="block text-sm font-bold mb-1 text-black">
        ¿Ha pagado?
      </label>
      <select
        className="w-full p-2 mb-4 border rounded bg-white text-black"
        value={hasPaid !== null ? (hasPaid ? "Sí" : "No") : ""}
        onChange={(e) => {
          setHasPaid(e.target.value === "Sí");
        }}
      >
        <option value="">Seleccione una opción</option>
        <option value="Sí">Sí</option>
        <option value="No">No</option>
      </select>
      <label className="block text-sm font-bold mb-1 text-black">
        Fecha de inicio de membresía
      </label>
      <input
        type="date"
        className="w-full p-2 mb-4 border rounded bg-white text-black placeholder-gray-500"
        value={membershipStart}
        onChange={(e) => setMembershipStart(e.target.value)}
      />
      <label className="block text-sm font-bold mb-1 text-black">
        Fecha de fin de membresía
      </label>
      <input
        type="date"
        className="w-full p-2 mb-4 border rounded bg-white text-black placeholder-gray-500"
        value={membershipEnd}
        onChange={(e) => setMembershipEnd(e.target.value)}
      />
      <PhoneInput
        defaultCountry="PE"
        placeholder="Número de teléfono principal"
        value={phone}
        onChange={setPhone}
        className="w-full p-2 mb-4 border rounded bg-white text-black placeholder-gray-500"
      />
      <PhoneInput
        defaultCountry="PE"
        placeholder="Número de emergencia"
        value={emergencyPhone}
        onChange={setEmergencyPhone}
        className="w-full p-2 mb-4 border rounded bg-white text-black placeholder-gray-500"
      />
      <Button
        className="bg-yellow-400 text-black hover:bg-yellow-500 w-full"
        onClick={handleSave}
      >
        Guardar Cliente
      </Button>
    </div>
  );
}

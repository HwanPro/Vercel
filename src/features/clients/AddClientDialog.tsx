// features/clients/AddClientDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Button } from "@/ui/button";
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
  // ⬇️ nuevo
  debt?: number; // S/. adeudado
}

type Cred = { username: string; password: string; phone: string };

export default function AddClientDialog({
  onSave,
  onCredentialsUpdate,
}: {
  onSave: (client: Omit<Client, "id">) => void;
  onCredentialsUpdate?: (cred: Cred) => void;
}) {
  // ---- estados base ----
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [membershipStart, setMembershipStart] = useState<string>("");
  const [membershipEnd, setMembershipEnd] = useState<string>("");

  const [address, setAddress] = useState("");
  const [social, setSocial] = useState("");

  const [manualDates, setManualDates] = useState<boolean>(false);
  const [usePromoAssistant, setUsePromoAssistant] = useState<boolean>(false);

  // presets para asistente
  type Preset = "30" | "90" | "180" | "365" | "custom";
  const [promoPreset, setPromoPreset] = useState<Preset>("30");
  const [customDays, setCustomDays] = useState<number>(30);
  const [usedDays, setUsedDays] = useState<number>(0);

  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [emergencyPhone, setEmergencyPhone] = useState<string | undefined>(
    undefined
  );

  const [debt, setDebt] = useState<string>(""); // como texto para input, convertimos al guardar

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [generatedUsername, setGeneratedUsername] = useState<string>("");
  const [generatedPassword, setGeneratedPassword] = useState<string>("");

  const [credentials, setCredentials] = useState<Cred | null>(null);

  // ---- helpers ----
  function generateUsername(name: string, phone?: string): string {
    // usa nombre + apellido para más unicidad
    const base = (name + lastName)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .slice(0, 12);
    const suffix =
      phone?.replace(/\D/g, "").slice(-3) ??
      Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
    return `${base}wg${suffix}`;
  }
  function generatePassword(): string {
    const part1 = Math.random().toString(36).substring(2, 6);
    const part2 = Math.random().toString(36).substring(2, 6);
    return `Cont-${part1}-${part2}`;
  }

  // ---- cálculo automático de fin con asistente ----
  const durationDays = useMemo(() => {
    const base = promoPreset === "custom" ? customDays : Number(promoPreset);
    return Math.max(
      0,
      (Number.isFinite(base) ? base : 0) -
        (Number.isFinite(usedDays) ? usedDays : 0)
    );
  }, [promoPreset, customDays, usedDays]);

  useEffect(() => {
    if (!manualDates || !usePromoAssistant || !membershipStart) return;
    const start = new Date(`${membershipStart}T00:00:00`);
    if (isNaN(start.getTime())) return;

    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);
    const iso = end.toISOString().slice(0, 10);
    setMembershipEnd(iso);
  }, [manualDates, usePromoAssistant, membershipStart, durationDays]);

  // ---- guardar ----
  const handleSave = async () => {
    setErrorMessage("");

    if (!name || !lastName || !phone) {
      setErrorMessage("Por favor, complete Nombres, Apellidos y Teléfono.");
      return;
    }
    if (!isValidPhoneNumber(phone)) {
      setErrorMessage("El número de teléfono principal no es válido.");
      return;
    }
    if (emergencyPhone && !isValidPhoneNumber(emergencyPhone)) {
      setErrorMessage("El número de emergencia no es válido.");
      return;
    }

    if (membershipStart && membershipEnd) {
      const start = new Date(membershipStart);
      const end = new Date(membershipEnd);
      if (!(start < end)) {
        setErrorMessage(
          "La fecha de inicio debe ser anterior a la fecha de fin."
        );
        return;
      }
    }

    const debtValue = Number(debt || 0);
    if (!Number.isFinite(debtValue) || debtValue < 0) {
      setErrorMessage("La deuda debe ser un número válido mayor o igual a 0.");
      return;
    }

    const username = generateUsername(name, phone);
    const password = generatePassword();
    setGeneratedUsername(username);
    setGeneratedPassword(password);

    const newClientData = {
      username, // 👈 esta
      firstName: name.trim(),
      lastName: lastName.trim(),
      plan: plan || "Mensual",
      membershipStart,
      membershipEnd,
      phone: phone!,
      emergencyPhone: emergencyPhone || "",
      address,
      social,
      hasPaid: debtValue === 0,
      password, // el backend la ignora (ok)
      debt: debtValue, // el backend hoy la ignora (no rompe)
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
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(
          errorData.error ||
            "No se pudo guardar el cliente. Intente nuevamente."
        );
        setLoading(false);
        return;
      }

      const result = await response.json();
      const tempPassword = result.tempPassword || password;

      const cred: Cred = { username, password: tempPassword, phone: phone! };

      const stored = localStorage.getItem("pendingCredentials");
      const list = stored ? JSON.parse(stored) : [];
      list.push(cred);
      localStorage.setItem("pendingCredentials", JSON.stringify(list));

      setCredentials(cred);
      onCredentialsUpdate?.(cred);

      onSave({
        ...newClientData,
        userName: username,
        password: tempPassword,
      });
    } catch (err) {
      console.error("Error al guardar cliente:", err);
      setErrorMessage("No se pudo guardar el cliente. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // ---- UI ----
  return (
    // ⬇️ contenedor responsive + scroll
    <div className="relative w-[calc(100vw-2rem)] max-w-xl sm:max-w-2xl bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto p-4 mx-auto">
      {errorMessage && (
        <p className="text-red-500 mb-2 text-sm">{errorMessage}</p>
      )}

      {/* Nombres y apellidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          className="w-full p-2 border rounded bg-white text-black text-sm"
          placeholder="Nombres"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded bg-white text-black text-sm"
          placeholder="Apellidos"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>

      {/* Dirección / Red social */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        <input
          className="w-full p-2 border rounded bg-white text-black text-sm"
          placeholder="Dirección (opcional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded bg-white text-black text-sm"
          placeholder="Red social (opcional)"
          value={social}
          onChange={(e) => setSocial(e.target.value)}
        />
      </div>

      {/* Selección de membresía automática (tu componente) */}
      <div className="mt-3">
        <MembershipSelection
          onPlanSelect={(selectedPlan, start, end) => {
            setPlan(selectedPlan);
            setMembershipStart(start);
            setMembershipEnd(end);
          }}
        />
      </div>

      {/* Fechas manuales */}
      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 text-black text-sm">
          <input
            type="checkbox"
            checked={manualDates}
            onChange={() => setManualDates(!manualDates)}
          />
          Ingresar fechas manualmente
        </label>

        {manualDates && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-bold mb-1 text-black">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  className="w-full p-2 border rounded bg-white text-black text-sm"
                  value={membershipStart}
                  onChange={(e) => setMembershipStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-black">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  className="w-full p-2 border rounded bg-white text-black text-sm"
                  value={membershipEnd}
                  onChange={(e) => setMembershipEnd(e.target.value)}
                />
              </div>
            </div>

            {/* Asistente de promo */}
            <label className="flex items-center gap-2 text-black text-sm mt-1">
              <input
                type="checkbox"
                checked={usePromoAssistant}
                onChange={() => setUsePromoAssistant(!usePromoAssistant)}
              />
              Usar asistente de promo (útil para migraciones)
            </label>

            {usePromoAssistant && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-bold mb-1 text-black">
                    Preset
                  </label>
                  <select
                    value={promoPreset}
                    onChange={(e) => setPromoPreset(e.target.value as Preset)}
                    className="w-full p-2 border rounded bg-white text-black text-sm"
                  >
                    <option value="30">Mensual (30 días)</option>
                    <option value="90">Trimestral (90 días)</option>
                    <option value="180">Semestral (180 días)</option>
                    <option value="365">Anual (365 días)</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1 text-black">
                    {promoPreset === "custom"
                      ? "Días (personalizado)"
                      : "Días (preset)"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full p-2 border rounded bg-white text-black text-sm"
                    value={
                      promoPreset === "custom"
                        ? customDays
                        : Number(promoPreset)
                    }
                    onChange={(e) =>
                      setCustomDays(Math.max(1, Number(e.target.value || 1)))
                    }
                    disabled={promoPreset !== "custom"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1 text-black">
                    Días ya consumidos
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full p-2 border rounded bg-white text-black text-sm"
                    value={usedDays}
                    onChange={(e) =>
                      setUsedDays(Math.max(0, Number(e.target.value || 0)))
                    }
                  />
                </div>

                <div className="col-span-1 sm:col-span-3 text-xs text-black/70">
                  Duración efectiva: <b>{durationDays}</b> días
                  {membershipStart && usePromoAssistant ? (
                    <>
                      {" · "}Nuevo fin calculado:{" "}
                      <b>
                        {(() => {
                          if (!membershipEnd) return "—";
                          return new Date(membershipEnd).toLocaleDateString(
                            "es-PE"
                          );
                        })()}
                      </b>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Teléfonos */}
      <div className="mt-3 space-y-2">
        <PhoneInput
          defaultCountry="PE"
          placeholder="Teléfono principal"
          value={phone}
          onChange={setPhone}
          className="w-full p-2 border rounded bg-white text-black text-sm"
        />
        <PhoneInput
          defaultCountry="PE"
          placeholder="Teléfono de emergencia (opcional)"
          value={emergencyPhone}
          onChange={setEmergencyPhone}
          className="w-full p-2 border rounded bg-white text-black text-sm"
        />
      </div>

      {/* Deuda */}
      <div className="mt-3">
        <label className="block text-sm font-bold mb-1 text-black">
          Deuda (S/.)
        </label>
        <input
          type="number"
          min={0}
          step="0.01"
          className="w-full p-2 border rounded bg-white text-black text-sm"
          placeholder="0.00"
          value={debt}
          onChange={(e) => setDebt(e.target.value)}
        />
        <p className="text-xs text-black/60 mt-1">
          Si pagó parcial, coloca aquí lo que queda por pagar. Si está al día,
          déjalo en 0.
        </p>
      </div>

      {/* Guardar */}
      <Button
        className="bg-yellow-400 text-black hover:bg-yellow-500 w-full text-sm mt-4"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "Guardando..." : "Guardar Cliente"}
      </Button>

      {/* Modal de credenciales */}
      {credentials && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="w-[calc(100vw-2rem)] max-w-md bg-white p-6 rounded-lg shadow-lg space-y-4 text-black max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-center">
              ¡Bienvenido a Wolf Gym!
            </h2>
            <p className="italic text-center text-gray-600">
              “El éxito es la suma de pequeños esfuerzos repetidos día tras
              día.”
            </p>

            <textarea
              readOnly
              className="w-full h-48 bg-gray-100 p-4 rounded text-sm text-black resize-none"
              value={`¡Bienvenido a Wolf Gym!
“El éxito es la suma de pequeños esfuerzos repetidos día tras día.”

Usuario: ${generatedUsername}
Contraseña: ${generatedPassword}

Puedes cambiar tu contraseña desde tu perfil presionando el botón Editar Perfil.

Accede a: www.wolf-gym.com`}
            />

            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => {
                navigator.clipboard.writeText(`¡Bienvenido a Wolf Gym!
“El éxito es la suma de pequeños esfuerzos repetidos día tras día.”

Usuario: ${generatedUsername}
Contraseña: ${generatedPassword}

Puedes cambiar tu contraseña desde tu perfil presionando el botón Editar Perfil.

Accede a: www.wolf-gym.com

PROHIBIDO RENDIRSE!!`);
              }}
            >
              📋 Copiar credenciales
            </Button>

            <Button
              className="bg-green-600 text-white w-full"
              onClick={() =>
                window.open(`https://wa.me/${credentials.phone}`, "_blank")
              }
            >
              Enviar vía WhatsApp
            </Button>

            <Button
              className="bg-yellow-400 w-full"
              onClick={() => setCredentials(null)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// src/app/admin/clients/page.tsx
"use client";

import ConfirmDialog from "@/ui/components/ConfirmDialog";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/ui/dialog";
import AddClientDialog from "@/features/clients/AddClientDialog";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditClientDialog from "@/features/clients/EditClientDialog";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

interface Client {
  id: string; // id de perfil (UI)
  userId: string; // id real de usuario (FK a users.id) ← NECESARIO para biometría
  userName: string;
  firstName: string;
  lastName: string;
  plan: string;
  membershipStart: string;
  membershipEnd: string;
  phone: string;
  emergencyPhone: string;
  prodfile_adress: string;
  profile_social: string;
  hasPaid: boolean;
  password?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const [pendingCredentials, setPendingCredentials] = useState<
    Array<{ username: string; password: string; phone: string }>
  >([]);

  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [fpStatus, setFpStatus] = useState<Record<string, boolean>>({}); // userId -> hasFingerprint

  const swalBase = useMemo(
    () => ({
      background: "#000",
      color: "#fff",
      confirmButtonColor: "#facc15",
    }),
    []
  );

  // ---- credenciales pendientes (localStorage) ----
  useEffect(() => {
    const stored = localStorage.getItem("pendingCredentials");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPendingCredentials(parsed.filter(Boolean));
        }
      } catch (error) {
        console.error("Error al parsear pendingCredentials:", error);
      }
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pendingCredentials") {
        const stored = localStorage.getItem("pendingCredentials");
        setPendingCredentials(stored ? JSON.parse(stored) : []);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ---- cargar clientes ----
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Error al obtener los clientes");

        const data = await response.json();

        // filtro: sacar admins
        const onlyClients = data.filter(
          (client: { user?: { role?: string } }) =>
            client?.user?.role !== "admin"
        );

        const sanitized: Client[] = onlyClients.map((c: any) => {
          const membershipStart = c.profile_start_date
            ? new Date(c.profile_start_date)
            : null;
          const membershipEnd = c.profile_end_date
            ? new Date(c.profile_end_date)
            : null;

          // ← intenta tomar user id de varias formas (mejor si el backend manda `user_id`)
          const userId: string =
            c.user_id ||
            c.user?.id ||
            c.profile_user_id || // por si tu API lo trae así
            c.profile_id; // fallback (no ideal)

          return {
            id: c.profile_id,
            userId,
            userName: c.profile_username || "",
            firstName: c.profile_first_name || "Sin nombre",
            lastName: c.profile_last_name || "Sin apellido",
            plan: c.profile_plan || "Sin plan",
            membershipStart: membershipStart
              ? membershipStart.toISOString().split("T")[0]
              : "",
            membershipEnd: membershipEnd
              ? membershipEnd.toISOString().split("T")[0]
              : "",
            phone: c.profile_phone || "",
            emergencyPhone: c.profile_emergency_phone || "",
            prodfile_adress: c.profile_adress || "",
            profile_social: c.profile_social || "",
            hasPaid: false,
          };
        });

        setClients(sanitized);
        setFilteredClients(sanitized);
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        toast.error("Error al cargar clientes. Inténtelo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // ---- estado de huellas por cliente (userId) ----
  useEffect(() => {
    const hydrate = async () => {
      const entries = await Promise.allSettled(
        clients.map(async (c) => {
          const r = await fetch(`/api/biometric/status/${c.userId}`, {
            cache: "no-store",
          });
          const j = await r.json().catch(() => ({ hasFingerprint: false }));
          return [c.userId, !!j?.hasFingerprint] as const;
        })
      );
      setFpStatus(
        Object.fromEntries(
          entries
            .filter((e) => e.status === "fulfilled")
            .map(
              (e) =>
                (e as PromiseFulfilledResult<readonly [string, boolean]>).value
            )
        )
      );
    };
    if (clients.length) hydrate();
  }, [clients]);

  // ---- búsqueda ----
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    const filter = clients.filter((c) =>
      `${c.firstName} ${c.lastName} ${c.userName}`.toLowerCase().includes(q)
    );
    setFilteredClients(filter);
  }, [searchQuery, clients]);

  // ---- helpers biométricos ----
  const captureOnce = async () => {
    const r = await fetch("/api/biometric/capture", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok || !j?.template) {
      throw new Error(j?.message || "No se pudo capturar la huella");
    }
    return j.template as string;
  };

  const registerFingerprint = async (userId: string) => {
    if (busy[userId]) return;
    setBusy((b) => ({ ...b, [userId]: true }));

    try {
      // ¿Ya tiene?
      const st = await fetch(`/api/biometric/status/${userId}`, {
        cache: "no-store",
      });
      const sj = await st.json().catch(() => ({ hasFingerprint: false }));
      if (sj?.hasFingerprint) {
        const ask = await Swal.fire({
          ...swalBase,
          title: "Reemplazar huella",
          text: "Este usuario ya tiene huella. ¿Deseas reemplazarla?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, reemplazar",
          cancelButtonText: "Cancelar",
        });
        if (!ask.isConfirmed) return;
      }

      const templates: string[] = [];

      for (let i = 1; i <= 3; i++) {
        await Swal.fire({
          ...swalBase,
          title: `Coloca tu dedo (${i}/3)`,
          text:
            i === 1
              ? "Manténlo firme hasta que termine"
              : "Retira y vuelve a colocar",
          icon: "info",
          timer: 850,
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
        } catch (e: any) {
          return Swal.fire({
            ...swalBase,
            title: "Error en captura",
            text: e?.message || "No se pudo capturar",
            icon: "error",
          });
        }

        await Swal.fire({
          ...swalBase,
          title: "Muestra capturada",
          timer: 450,
          showConfirmButton: false,
        });
      }

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
        body: JSON.stringify({ templates }),
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

      setFpStatus((s) => ({ ...s, [userId]: true }));
      return Swal.fire({
        ...swalBase,
        title: jr?.message || "Huella registrada",
        icon: "success",
        timer: 1100,
        showConfirmButton: false,
      });
    } finally {
      setBusy((b) => ({ ...b, [userId]: false }));
    }
  };

  const verifyFingerprint = async (userId: string) => {
    if (busy[userId]) return;
    setBusy((b) => ({ ...b, [userId]: true }));
    try {
      await Swal.fire({
        ...swalBase,
        title: "Coloca tu dedo en el lector",
        text: "Manténlo hasta que termine la verificación",
        icon: "info",
        timer: 850,
        showConfirmButton: false,
      });

      Swal.fire({
        ...swalBase,
        title: "Verificando huella…",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch(`/api/biometric/verify/${userId}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));

      const isError =
        data?.ok === false && typeof data?.score === "number" && data.score < 0;
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
        icon: data?.match ? "success" : "error",
        timer: 1300,
        showConfirmButton: false,
      });
    } finally {
      setBusy((b) => ({ ...b, [userId]: false }));
    }
  };

  // ---- eliminar cliente ----
  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) {
      toast.error("No se pudo identificar al cliente a eliminar.");
      return;
    }
    try {
      const response = await fetch(`/api/clients/${clientToDelete}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar el cliente");
      }
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete));
      setFilteredClients((prev) => prev.filter((c) => c.id !== clientToDelete));
      toast.success("Cliente eliminado con éxito.");
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      toast.error("Error al eliminar cliente. Inténtelo más tarde.");
    } finally {
      setShowConfirm(false);
      setClientToDelete(null);
    }
  };

  if (loading) {
    return <p className="text-center text-yellow-400">Cargando clientes...</p>;
  }

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <ToastContainer />

      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">
          Gestión de Clientes
        </h1>
        <Link
          href="/admin/dashboard"
          className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 w-full md:w-auto text-center"
        >
          Volver al Dashboard
        </Link>
      </div>

      {/* BLOQUE: Búsqueda + Alta */}
      <section className="mb-6 border border-yellow-400/40 rounded-xl p-4">
        <h2 className="text-xl font-semibold text-yellow-400 mb-3">
          Administración
        </h2>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <input
            type="text"
            className="p-2 rounded border w-full md:max-w-sm text-black"
            placeholder="Buscar por nombre, apellido o usuario"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500 w-full md:w-auto">
                Añadir Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
              <DialogTitle className="text-black text-lg font-bold mb-4">
                Registrar Nuevo Cliente
              </DialogTitle>
              <AddClientDialog
                onSave={(newClient) => {
                  const clientWithId: Client = {
                    id:
                      globalThis.crypto?.randomUUID?.() ??
                      Math.random().toString(36).slice(2, 11),
                    userId:
                      (newClient as any)?.userId ??
                      (newClient as any)?.id ??
                      "",

                    userName: (newClient as any)?.userName ?? "",
                    firstName: (newClient as any)?.firstName ?? "Sin nombre",
                    lastName: (newClient as any)?.lastName ?? "Sin apellido",

                    // 👇 ojo: 'plan' en minúscula
                    plan: (newClient as any)?.plan ?? "Sin plan",
                    membershipStart: (newClient as any)?.membershipStart ?? "",
                    membershipEnd: (newClient as any)?.membershipEnd ?? "",

                    phone: (newClient as any)?.phone ?? "",
                    emergencyPhone: (newClient as any)?.emergencyPhone ?? "",
                    prodfile_adress: (newClient as any)?.prodfile_adress ?? "",
                    profile_social: (newClient as any)?.profile_social ?? "",
                    hasPaid: (newClient as any)?.hasPaid ?? false,
                  };

                  setClients((prev) => [...prev, clientWithId]);
                  setFilteredClients((prev) => [...prev, clientWithId]);
                  toast.success("Cliente agregado con éxito.");
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* BLOQUE: Tabla */}
      <section className="overflow-x-auto border border-yellow-400/40 rounded-xl p-4">
        <h2 className="text-xl font-semibold text-yellow-400 mb-3">Listado</h2>
        <Table className="table-auto w-full border-collapse">
          <TableHeader>
            <TableRow>
              <TableHead className="text-yellow-400">Nombre</TableHead>
              <TableHead className="text-yellow-400">Apellidos</TableHead>
              <TableHead className="text-yellow-400">Plan</TableHead>
              <TableHead className="text-yellow-400">Inicio</TableHead>
              <TableHead className="text-yellow-400">Fin</TableHead>
              <TableHead className="text-yellow-400">Huella</TableHead>
              <TableHead className="text-yellow-400">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => {
                const uid = client.userId || client.id;
                const has = !!fpStatus[uid];
                return (
                  <TableRow key={client.id} className="hover:bg-gray-800/40">
                    <TableCell>{client.firstName}</TableCell>
                    <TableCell>{client.lastName}</TableCell>
                    <TableCell>{client.plan}</TableCell>
                    <TableCell>{client.membershipStart || "—"}</TableCell>
                    <TableCell>{client.membershipEnd || "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
                          has
                            ? "bg-green-600/20 text-green-400 border border-green-600/40"
                            : "bg-red-600/20 text-red-400 border border-red-600/40"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            has ? "bg-green-400" : "bg-red-400"
                          }`}
                        />
                        {has ? "Registrada" : "Sin huella"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          className={`${
                            busy[uid]
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-yellow-500"
                          } bg-yellow-400 text-black`}
                          onClick={() => registerFingerprint(uid)}
                          disabled={!!busy[uid]}
                        >
                          {has ? "Reemplazar huella" : "Registrar huella"}
                        </Button>

                        <Button
                          className={`border border-yellow-400 text-yellow-400 hover:bg-yellow-500 hover:text-black ${
                            busy[uid] ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          onClick={() => verifyFingerprint(uid)}
                          disabled={!!busy[uid]}
                          variant="outline"
                        >
                          Verificar
                        </Button>

                        <EditClientDialog
                          client={{ ...client, email: client.userName }}
                          onUpdate={(updated) => {
                            setClients((prev) =>
                              prev.map((c) =>
                                c.id === updated.id ? { ...c, ...updated } : c
                              )
                            );
                            setFilteredClients((prev) =>
                              prev.map((c) =>
                                c.id === updated.id ? { ...c, ...updated } : c
                              )
                            );
                            toast.success("Cliente actualizado");
                          }}
                        />

                        <Button
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDeleteClick(client.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No hay clientes disponibles
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      {/* BLOQUE: Credenciales pendientes */}
      <section className="mt-8 p-4 border border-yellow-400/40 rounded-xl bg-gray-100 text-black">
        <h2 className="text-xl font-bold mb-4">Credenciales Pendientes</h2>
        {pendingCredentials.length > 0 ? (
          pendingCredentials.map((cred, index) => (
            <div key={index} className="mb-2 p-2 border rounded">
              <p>
                <span className="font-bold">Usuario:</span> {cred.username}
              </p>
              <p>
                <span className="font-bold">Contraseña:</span> {cred.password}
              </p>
              <p>
                <span className="font-bold">Teléfono:</span> {cred.phone}
              </p>
              <div className="flex gap-2 mt-1">
                <Button
                  className="bg-green-600 text-white text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Usuario: ${cred.username}\nContraseña: ${cred.password}\nTeléfono: ${cred.phone}`
                    );
                    toast.success("Credenciales copiadas al portapapeles.");
                  }}
                >
                  Copiar
                </Button>
                <Button
                  className="bg-green-600 text-white"
                  onClick={() =>
                    window.open(`https://wa.me/${cred.phone}`, "_blank")
                  }
                >
                  Abrir chat en WhatsApp
                </Button>
                <Button
                  className="bg-red-500 text-white text-xs"
                  onClick={() => {
                    const updated = pendingCredentials.filter(
                      (_, i) => i !== index
                    );
                    localStorage.setItem(
                      "pendingCredentials",
                      JSON.stringify(updated)
                    );
                    setPendingCredentials(updated);
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p>No hay credenciales pendientes.</p>
        )}
        <p className="mt-4 text-center italic">
          &ldquo;El éxito es la suma de pequeños esfuerzos repetidos día tras
          día.&rdquo;
        </p>
      </section>

      {showConfirm && (
        <ConfirmDialog
          message="¿Estás seguro de que deseas eliminar este cliente?"
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

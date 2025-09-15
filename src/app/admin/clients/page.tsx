// src/app/admin/clients/page.tsx
"use client";

import ConfirmDialog from "@/ui/components/ConfirmDialog";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/ui/button";

type ClientResponse = {
  tempPassword?: string;
  clientProfile?: {
    user_id: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
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

// Type definitions
type BiometricResponse = {
  ok: boolean;
  message?: string;
  template?: string;
  hasFingerprint?: boolean;
  match?: boolean;
  score?: number;
  threshold?: number;
};

interface SwalBase {
  background: string;
  color: string;
  confirmButtonColor: string;
}

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
  // Define API response types
  interface ApiClient {
    profile_id: string;
    user_id: string;
    user?: {
      role?: string;
    };
    profile_username?: string;
    profile_first_name?: string;
    profile_last_name?: string;
    profile_plan?: string;
    profile_start_date?: string;
    profile_end_date?: string;
    profile_phone?: string;
    profile_emergency_phone?: string;
    profile_address?: string;
    profile_social?: string;
  }

  const { data: clientsData = [], mutate } = useSWR<Client[]>('/api/clients', 
    async (url) => {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar clientes');
      const data: ApiClient[] = await res.json();
      return data.filter(client => client?.user?.role !== 'admin').map((c: ApiClient) => ({
        id: c.profile_id,
        userId: c.user_id,
        userName: c.profile_username || '',
        firstName: c.profile_first_name || 'Sin nombre',
        lastName: c.profile_last_name || 'Sin apellido',
        plan: c.profile_plan || 'Sin plan',
        membershipStart: c.profile_start_date ? new Date(c.profile_start_date).toISOString().split('T')[0] : '',
        membershipEnd: c.profile_end_date ? new Date(c.profile_end_date).toISOString().split('T')[0] : '',
        phone: c.profile_phone || '',
        emergencyPhone: c.profile_emergency_phone || '',
        prodfile_adress: c.profile_address || '',
        profile_social: c.profile_social || '',
        hasPaid: false
      }));
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  // State management
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [fpStatus, setFpStatus] = useState<Record<string, boolean>>({});
  
  // Use clientsData directly from SWR instead of local state
  const clients = clientsData;

  // Define Client type for the new client data
  interface NewClientData extends Omit<Client, 'id' | 'userId' | 'userName' | 'firstName' | 'lastName' | 'plan' | 'membershipStart' | 'membershipEnd' | 'phone' | 'emergencyPhone' | 'prodfile_adress' | 'profile_social' | 'hasPaid'> {
    userId?: string;
    userName?: string;
    firstName?: string;
    lastName?: string;
    plan?: string;
    membershipStart?: string;
    membershipEnd?: string;
    phone?: string;
    emergencyPhone?: string;
    prodfile_adress?: string;
    profile_social?: string;
    hasPaid?: boolean;
  }

  const [pendingCredentials, setPendingCredentials] = useState<
    Array<{ username: string; password: string; phone: string }>
  >([])

  const swalBase: SwalBase = useMemo(
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

  // Actualizar clientes filtrados cuando cambia la búsqueda o la lista de clientes
  useEffect(() => {
    if (!clients || clients.length === 0) return;
    
    const q = searchQuery.trim().toLowerCase();
    const filtered = q 
      ? clients.filter(c => 
          `${c.firstName || ''} ${c.lastName || ''} ${c.userName || ''} ${c.phone || ''}`.toLowerCase().includes(q)
        )
      : [...clients];
      
    setFilteredClients(filtered);
  }, [searchQuery, clients]);
  const ENABLE_AUTO_STATUS = false;

  // ---- estado de huellas por cliente (userId) ----
  useEffect(() => {
    if (!ENABLE_AUTO_STATUS) return;
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
  }, [ENABLE_AUTO_STATUS, clients]);


  // Manejar la adición de un nuevo cliente
  // Handle add client function - used in the component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddClient = useMemo(() => async (newClient: NewClientData): Promise<ClientResponse> => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClient)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al guardar el cliente');
      }

      const responseData = await response.json();
      
      // Actualizar la caché de SWR
      await mutate();
      
      // Mostrar notificación de éxito
      toast.success('Cliente registrado exitosamente');
      
      return responseData as ClientResponse;
    } catch (error) {
      console.error('Error al agregar cliente:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar el cliente');
      throw error;
    }
  }, [mutate]);

  // ---- helpers biométricos ----
  const captureOnce = async (): Promise<string> => {
    try {
      const response = await fetch("/api/biometric/capture", { method: "POST" });
      const data: BiometricResponse = await response.json().catch(() => ({ ok: false } as BiometricResponse));
      
      if (!response.ok || !data?.ok || !data?.template) {
        throw new Error(data?.message || "No se pudo capturar la huella");
      }
      
      if (typeof data.template !== 'string') {
        throw new Error("Formato de plantilla de huella inválido");
      }
      
      return data.template;
    } catch (error) {
      console.error("Error en captura de huella:", error);
      throw error instanceof Error ? error : new Error("Error desconocido al capturar huella");
    }
  };

  // Define RegisterFingerprintResponse type
  interface RegisterFingerprintResponse {
    ok: boolean;
    message?: string;
    template?: string;
  }

  const registerFingerprint = async (userId: string) => {
    if (!userId) {
      toast.error(
        "Este cliente no tiene userId válido. Actualiza la lista o recarga la página."
      );
      return;
    }
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
          
          await Swal.fire({
            ...swalBase,
            title: "Muestra capturada",
            timer: 450,
            showConfirmButton: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "No se pudo capturar";
          await Swal.fire({
            ...swalBase,
            title: "Error en captura",
            text: errorMessage,
            icon: "error" as const,
          });
          return;
        }
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
      const jr: RegisterFingerprintResponse = await res.json().catch(() => ({ ok: false }));

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
    if (!userId) {
      toast.error("Este cliente no tiene userId válido.");
      return;
    }
    
    setBusy((b) => ({ ...b, [userId]: true }));
    
    try {
      // Primero capturamos la huella
      const template = await captureOnce();
      
      // Luego la verificamos
      const response = await fetch(`/api/biometric/verify/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template })
      });
      
      const data = await response.json() as {
        ok: boolean;
        match?: boolean;
        score?: number;
        threshold?: number;
        message?: string;
      };
      
      const isError = data.ok === false && typeof data.score === 'number' && data.score < 0;
      const baseMsg = data?.message || "";
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
      
      return data;
    } catch (error) {
      console.error("Error en verificación de huella:", error);
      toast.error("Error al verificar la huella. Intente nuevamente.");
      throw error;
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
      setIsPageLoading(true);
      const response = await fetch(`/api/clients/${clientToDelete}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData?.error || "Error al eliminar el cliente");
      }
      // Update SWR cache by refetching data
      await mutate();
      setFilteredClients(prev => prev.filter(c => c.id !== clientToDelete));
      toast.success("Cliente eliminado con éxito");
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar el cliente");
    } finally {
      setIsPageLoading(false);
      setShowConfirm(false);
      setClientToDelete(null);
    }
  };

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
            <DialogContent className="w-[calc(100vw-2rem)] max-w-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
              <DialogTitle className="sr-only">...</DialogTitle>
              <div className="p-4">
                Registrar Nuevo Cliente
                <AddClientDialog
                  onSave={async (newClient) => {
                    // Use the handleAddClient function to save the client
                    await handleAddClient({
                      userId: newClient.userName, // Use userName as userId for compatibility
                      userName: newClient.userName,
                      firstName: newClient.firstName,
                      lastName: newClient.lastName,
                      plan: newClient.plan,
                      membershipStart: newClient.membershipStart,
                      membershipEnd: newClient.membershipEnd,
                      phone: newClient.phone,
                      emergencyPhone: newClient.emergencyPhone,
                      prodfile_adress: (newClient as { address?: string }).address || "",
                      profile_social: (newClient as { social?: string }).social || "",
                      hasPaid: newClient.hasPaid,
                    });

                    // Update SWR cache by refetching data
                    await mutate();
                    toast.success("Cliente agregado con éxito.");
                  }}
                />
              </div>
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
                          className={`border border-yellow-400 text-yellow-600 hover:bg-yellow-500 hover:text-black ${
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
                          onUpdate={async (updated) => {
                            // Update SWR cache by refetching data
                            await mutate();
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

// src/app/admin/clients/page.tsx
"use client";

import ConfirmDialog from "@/ui/components/ConfirmDialog";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
import DebtManagement from "@/features/clients/DebtManagement";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import {
  Activity,
  ArrowLeft,
  BadgeDollarSign,
  Fingerprint,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

// Type definitions
type BiometricResponse = {
  ok: boolean;
  message?: string;
  template?: string;
  image?: string;
  hasFingerprint?: boolean;
  match?: boolean;
  score?: number;
  threshold?: number;
};

interface SwalBase {
  background: string;
  color: string;
  confirmButtonColor: string;
  customClass: {
    confirmButton: string;
    cancelButton: string;
  };
}

// Removed unused ApiUser type

interface Client {
  id: string;
  userId: string;
  userName: string;
  firstName: string;
  lastName: string;
  plan: string;
  membershipStart: string;
  membershipEnd: string;
  phone: string;
  emergencyPhone: string;
  documentNumber: string;
  prodfile_adress: string;
  profile_social: string;
  hasPaid: boolean;
  password?: string;
  hasFingerprint?: boolean;

  // 👇 NUEVO (para ordenar por fecha de registro)
  createdAt?: string; // 'YYYY-MM-DD'
}

interface ApiClient {
  profile_id: string;
  user_id: string;
  user?: {
    id?: string;
    role?: string;
    username?: string;
    createdAt?: string | Date; 
    fingerprints?: Array<{ id: string }>;
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
  documentNumber?: string;
}

export default function ClientsPage() {

  const { data: clientsData = [], mutate } = useSWR<Client[]>(
    "/api/clients",
    async (url) => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar clientes");
      const data: ApiClient[] = await res.json();
      return data
        .filter((client) => client?.user?.role !== "admin")
        .map((c: ApiClient) => ({
          id: c.profile_id,
          userId: c.user_id,
          userName: c.user?.username || c.profile_username || "",
          firstName: c.profile_first_name || "Sin nombre",
          lastName: c.profile_last_name || "Sin apellido",
          plan: c.profile_plan || "Sin plan",
          membershipStart: c.profile_start_date
            ? new Date(c.profile_start_date).toISOString().split("T")[0]
            : "",
          membershipEnd: c.profile_end_date
            ? new Date(c.profile_end_date).toISOString().split("T")[0]
            : "",
          phone: c.profile_phone || "",
          emergencyPhone: c.profile_emergency_phone || "",
          documentNumber: c.documentNumber || "",
          prodfile_adress: c.profile_address || "",
          profile_social: c.profile_social || "",
          hasPaid: false,
          createdAt: c.user?.createdAt
            ? new Date(c.user.createdAt).toISOString().split("T")[0]
            : "",
          hasFingerprint: Boolean(c.user?.fingerprints?.length),
        }));
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  const deleteFingerprint = async (userId: string) => {
    if (!userId) {
      toast.error("Este cliente no tiene userId válido.");
      return;
    }
    const confirm = await Swal.fire({
      ...swalBase,
      title: "Eliminar huella",
      text: "¿Seguro que deseas eliminar la huella de este usuario?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    setBusy((b) => ({ ...b, [userId]: true }));
    try {
      const res = await fetch(`/api/biometric/delete/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || "No se pudo eliminar la huella");
      }
      setFpStatus((s) => ({ ...s, [userId]: false }));
      toast.success("Huella eliminada");
    } catch (err) {
      console.error("Eliminar huella:", err);
      toast.error(
        err instanceof Error ? err.message : "Error eliminando huella"
      );
    } finally {
      setBusy((b) => ({ ...b, [userId]: false }));
    }
  };

  // State management
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [fpStatus, setFpStatus] = useState<Record<string, boolean>>({});
  
  // Estados para gestión de deudas
  const [showDebtDialog, setShowDebtDialog] = useState(false);
  const [selectedClientForDebt, setSelectedClientForDebt] = useState<{
    id: string;
    name: string;
    profileId: string;
  } | null>(null);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  // Use clientsData directly from SWR instead of local state
  const clients = clientsData;
  const totalClients = clients.length;
  const activePlans = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return clients.filter((client) => {
      if (!client.membershipEnd) return false;
      return new Date(client.membershipEnd).getTime() >= today.getTime();
    }).length;
  }, [clients]);
  const fingerprintCount = useMemo(
    () => clients.filter((client) => client.hasFingerprint || fpStatus[client.userId]).length,
    [clients, fpStatus],
  );
  type SortKey =
    | "firstName"
    | "lastName"
    | "plan"
    | "membershipStart"
    | "membershipEnd"
    | "createdAt";
  const [sortBy, setSortBy] = useState<SortKey>("firstName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: SortKey) => {
    setSortBy((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return key;
    });
  };

  const cmp = useMemo(() => (a: Client, b: Client, key: SortKey) => {
    const va = a[key] ?? "";
    const vb = b[key] ?? "";
    if (
      key === "membershipStart" ||
      key === "membershipEnd" ||
      key === "createdAt"
    ) {
      const da = va ? new Date(va).getTime() : 0;
      const db = vb ? new Date(vb).getTime() : 0;
      return da - db;
    }
    return String(va).localeCompare(String(vb), "es", { sensitivity: "base" });
  }, []);

  const getMembershipDays = (membershipEnd: string) => {
    if (!membershipEnd) {
      return {
        label: "Sin fecha",
        className: "border-zinc-700 bg-zinc-900 text-zinc-300",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(`${membershipEnd}T00:00:00`);
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / 86_400_000);

    if (diffDays < 0) {
      const days = Math.abs(diffDays);
      return {
        label: `Venció hace ${days} ${days === 1 ? "día" : "días"}`,
        className: "border-red-500/40 bg-red-600/15 text-red-300",
      };
    }

    if (diffDays === 0) {
      return {
        label: "Vence hoy",
        className: "border-amber-400/50 bg-amber-500/15 text-amber-200",
      };
    }

    return {
      label: `${diffDays} ${diffDays === 1 ? "día" : "días"}`,
      className:
        diffDays <= 7
          ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
          : "border-green-500/40 bg-green-600/15 text-green-300",
    };
  };

  // Define Client type for the new client data
  interface NewClientData {
    firstName: string;
    lastName: string;
    username: string;
    phoneNumber: string;
    profile: {
      plan: string;
      startDate: string;
      endDate: string;
      emergencyPhone: string;
      address: string;
      social: string;
      documentNumber: string;
      debt: number;
    };
  }

  const [pendingCredentials, setPendingCredentials] = useState<
    Array<{ username: string; password: string; phone: string; message?: string; whatsappUrl?: string | null }>
  >([]);

  const persistPendingCredentials = (
    updater: Array<{ username: string; password: string; phone: string; message?: string; whatsappUrl?: string | null }>
  ) => {
    localStorage.setItem("pendingCredentials", JSON.stringify(updater));
    setPendingCredentials(updater);
  };

  const swalBase: SwalBase = useMemo(
    () => ({
      background: "#000",
      color: "#fff",
      confirmButtonColor: "#facc15",
      customClass: {
        confirmButton: "swal-confirm-black",
        cancelButton: "swal-cancel-contrast",
      },
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
    const base = q
      ? clients.filter((c) =>
          (
            `${c.firstName || ""} ${c.lastName || ""} ${c.userName || ""} ${c.phone || ""}` +
            ` ${c.documentNumber || ""}`
          )
            .toLowerCase()
            .includes(q)
        )
      : [...clients];

    base.sort((a, b) => {
      const r = cmp(a, b, sortBy);
      return sortDir === "asc" ? r : -r;
    });

    setFilteredClients(base);
  }, [searchQuery, clients, sortBy, sortDir]);

  useEffect(() => {
    if (!clients.length) return;
    setFpStatus(
      Object.fromEntries(clients.map((client) => [client.userId, Boolean(client.hasFingerprint)])),
    );
  }, [clients]);

  // Manejar la adición de un nuevo cliente
  // Handle add client function - used in the component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddClient = useMemo(
    () =>
      async (newClient: NewClientData): Promise<ClientResponse> => {
        try {
          const response = await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(newClient),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Error al guardar el cliente");
          }

          const responseData = await response.json();

          // Actualizar la caché de SWR
          await mutate();

          // Mostrar notificación de éxito
          toast.success("Cliente registrado exitosamente");

          return responseData as ClientResponse;
        } catch (error) {
          console.error("Error al agregar cliente:", error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Error al guardar el cliente"
          );
          throw error;
        }
      },
    [mutate]
  );

  const sendCredentials = async (client: Client) => {
    try {
      setBusy((b) => ({ ...b, [client.id]: true }));
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "credentials" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "No se pudieron generar las credenciales");
      }

      const cred = {
        username: String(data.username || client.userName),
        password: String(data.password || ""),
        phone: String(data.phone || client.phone || ""),
        message: String(data.message || ""),
        whatsappUrl: data.whatsappUrl ?? null,
      };
      persistPendingCredentials([cred, ...pendingCredentials]);
      toast.success("Credenciales generadas");
      if (cred.whatsappUrl) window.open(cred.whatsappUrl, "_blank");
    } catch (error) {
      console.error("Enviar credenciales:", error);
      toast.error(error instanceof Error ? error.message : "Error generando credenciales");
    } finally {
      setBusy((b) => ({ ...b, [client.id]: false }));
    }
  };

  // ---- helpers biométricos ----
  const captureOnce = async (): Promise<{template: string; image?: string}> => {
    try {
      const response = await fetch("/api/biometric/capture", {
        method: "POST",
      });
      const data: BiometricResponse = await response
        .json()
        .catch(() => ({ ok: false }) as BiometricResponse);

      if (!response.ok || !data?.ok || !data?.template) {
        throw new Error(data?.message || "No se pudo capturar la huella");
      }

      if (typeof data.template !== "string") {
        throw new Error("Formato de plantilla de huella inválido");
      }

      return {
        template: data.template,
        image: data.image
      };
    } catch (error) {
      console.error("Error en captura de huella:", error);
      throw error instanceof Error
        ? error
        : new Error("Error desconocido al capturar huella");
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
              ? "Manténlo firme hasta que termine la captura"
              : "Retira el dedo y vuelve a colocarlo firmemente",
          icon: "info",
          timer: 2500,
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
          const {template, image} = await captureOnce();
          templates.push(template);

          // Mostrar imagen de huella capturada si está disponible
          await Swal.fire({
            ...swalBase,
            title: "✓ Muestra capturada correctamente",
            html: image 
              ? `<img src="data:image/bmp;base64,${image}" style="max-width:250px; margin:10px auto; display:block; border:2px solid #22c55e; border-radius:8px;" alt="Huella capturada"/>`
              : undefined,
            text: !image && i < 3 ? "Prepárate para la siguiente captura" : !image ? "Procesando todas las muestras..." : "",
            icon: "success",
            timer: image ? 2000 : 1200,
            showConfirmButton: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "No se pudo capturar la huella";
          await Swal.fire({
            ...swalBase,
            title: "❌ Error al capturar huella",
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
        const jr: RegisterFingerprintResponse = await res
          .json()
          .catch(() => ({ ok: false }));

        if (!res.ok || !jr?.ok) {
          return Swal.fire({
            ...swalBase,
            title: "❌ Error al registrar huella",
            text: jr?.message || "No se pudo completar el registro. Por favor, inténtalo nuevamente.",
            icon: "error",
          });
        }

        setFpStatus((s) => ({ ...s, [userId]: true }));
        return Swal.fire({
          ...swalBase,
          title: "✅ " + (jr?.message || "Huella registrada exitosamente"),
          text: "El cliente puede ahora usar su huella para registrar asistencia",
          icon: "success",
          timer: 2500,
          showConfirmButton: false,
        });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al procesar la huella";
      await Swal.fire({
        ...swalBase,
        title: "❌ Error al procesar huella",
        text: errorMessage,
        icon: "error" as const,
      });
      return;
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
      // Mostrar animación de verificación
      Swal.fire({
        ...swalBase,
        title: "🔍 Verificando Huella",
        html: `
          <div class="fingerprint-scanner">
            <div class="scanner-animation">
              <div class="pulse-ring"></div>
              <div class="pulse-ring-2"></div>
              <div class="fingerprint-icon">👆</div>
            </div>
            <div class="scanner-text">
              <p style="margin: 15px 0 5px 0; font-size: 16px; color: #333;">Coloca tu dedo para verificar</p>
              <small style="opacity: 0.7; font-size: 13px;">Presiona firmemente y mantén quieto</small>
            </div>
          </div>
          <style>
            .fingerprint-scanner { text-align: center; padding: 10px; }
            .scanner-animation { position: relative; display: inline-block; margin: 10px 0 20px 0; }
            .pulse-ring, .pulse-ring-2 {
              position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
              width: 80px; height: 80px; border: 3px solid #007bff; border-radius: 50%;
              animation: pulse 2s infinite;
            }
            .pulse-ring-2 { animation-delay: 1s; border-color: #28a745; }
            .fingerprint-icon { font-size: 40px; z-index: 10; position: relative; animation: bounce 1.5s infinite; }
            @keyframes pulse {
              0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
              100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
            }
            @keyframes bounce {
              0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-10px); }
              60% { transform: translateY(-5px); }
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .spinner { display: inline-block; animation: spin 1s linear infinite; margin-right: 8px; }
          </style>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        customClass: { popup: 'fingerprint-popup' }
      });

      // Actualizar animación a "capturando"
      setTimeout(() => {
        const textElement = document.querySelector('.scanner-text p') as HTMLElement;
        const iconElement = document.querySelector('.fingerprint-icon') as HTMLElement;
        if (textElement && iconElement) {
          textElement.innerHTML = '<span class="spinner">🔄</span> Capturando...';
          textElement.style.color = '#007bff';
          iconElement.innerHTML = '🔄';
          iconElement.style.animation = 'spin 1s linear infinite';
        }
      }, 500);

      // Capturar una sola vez
      const {template} = await captureOnce();

      // Actualizar a "verificando"
      const textElement = document.querySelector('.scanner-text p') as HTMLElement;
      const iconElement = document.querySelector('.fingerprint-icon') as HTMLElement;
      if (textElement && iconElement) {
        textElement.innerHTML = '<span class="spinner">🔍</span> Verificando...';
        textElement.style.color = '#ffc107';
        iconElement.innerHTML = '🔍';
      }

      // Verificar una sola vez
      const response = await fetch(`/api/biometric/verify/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        match?: boolean;
        score?: number;
        threshold?: number;
        message?: string;
      };

      // Cerrar animación
      Swal.close();

      const isError = data.ok === false && typeof data.score === "number" && data.score < 0;
      const baseMsg = data?.message || "";
      const extra = Number.isFinite(data?.score)
        ? ` (score=${data.score}, thr=${data?.threshold ?? "?"})`
        : "";

      await Swal.fire({
        ...swalBase,
        title: data?.match
          ? "✅ Huella verificada"
          : isError
            ? "❌ Error del lector"
            : "❌ No coincide",
        text: `${baseMsg}${extra}`,
        icon: data?.match ? "success" : "error",
        timer: 1800,
        showConfirmButton: false,
      });

      return data;
    } catch (error) {
      Swal.close();
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

    const id = clientToDelete;
    try {
      setIsPageLoading(true);
      setDeleting((m) => ({ ...m, [id]: true }));

      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData?.error || "Error al eliminar el cliente");
      }

      await mutate(); // refresca lista
      setFilteredClients((prev) => prev.filter((c) => c.id !== id));
      toast.success("Cliente eliminado con éxito");
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar el cliente"
      );
    } finally {
      setDeleting((m) => ({ ...m, [id]: false }));
      setIsPageLoading(false);
      setShowConfirm(false);
      setClientToDelete(null);
    }
  };

  function BtnSpinner() {
    return (
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-0.125em]"
        aria-label="Cargando"
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <ToastContainer />

      <header className="border-b border-zinc-800 bg-black px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 text-yellow-400">
              <Users className="h-7 w-7" />
              <h1 className="text-2xl font-black md:text-3xl">Clientes y membresías</h1>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              Registro, planes, deudas y huellas de clientes activos.
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 py-2.5 font-semibold text-black transition hover:bg-yellow-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 p-4 md:p-8">
        <section className="grid gap-3 md:grid-cols-4">
          <ClientMetric icon={<Users className="h-4 w-4" />} label="Clientes" value={totalClients} />
          <ClientMetric icon={<ShieldCheck className="h-4 w-4" />} label="Planes vigentes" value={activePlans} tone="yellow" />
          <ClientMetric icon={<Fingerprint className="h-4 w-4" />} label="Con huella" value={fingerprintCount} />
          <ClientMetric icon={<Activity className="h-4 w-4" />} label="Mostrando" value={filteredClients.length} />
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-yellow-400">Búsqueda y acciones</h2>
              <p className="text-sm text-zinc-500">Filtra por nombre, apellido, usuario, teléfono o DNI.</p>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
              <div className="relative w-full md:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  className="h-10 w-full rounded-md border border-zinc-800 bg-black pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400"
                  placeholder="Buscar cliente"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
            <Button 
              onClick={async () => {
                await mutate();
                toast.success("Listado actualizado");
              }}
              variant="outline" 
              className="inline-flex flex-1 items-center gap-2 !border-zinc-700 !bg-zinc-900 !text-white hover:!bg-zinc-800 md:flex-none"
            >
              <RefreshCcw className="h-4 w-4" />
              Refrescar
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="inline-flex flex-1 items-center gap-2 bg-yellow-400 text-black hover:bg-yellow-300 md:flex-none">
                  <Plus className="h-4 w-4" />
                  Nuevo cliente
                </Button>
              </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
              <DialogTitle className="sr-only">...</DialogTitle>
              <div className="p-4">
                Registrar Nuevo Cliente
                <AddClientDialog
                  onSave={async (newClient) => {
                    // El payload ya viene con la estructura correcta desde AddClientDialog
                    return await handleAddClient(newClient);
                  }}
                  onCredentialsUpdate={(cred) =>
                    persistPendingCredentials([
                      { ...cred },
                      ...pendingCredentials,
                    ])
                  }
                />
              </div>
            </DialogContent>
            </Dialog>
              </div>
            </div>
          </div>
        </section>

      <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
        <div className="border-b border-zinc-800 bg-black px-4 py-3">
          <h2 className="text-lg font-bold text-yellow-400">Directorio de clientes</h2>
          <p className="text-sm text-zinc-500">Vista operativa para pagos, huellas y edición de perfiles.</p>
        </div>

        <div className="overflow-x-auto">
          <div className="max-h-[58vh] overflow-y-auto">
            <Table className="table-auto w-full border-collapse">
              {/* Encabezado sticky */}
              <TableHeader className="sticky top-0 z-10 !bg-zinc-950">
                <TableRow className="border-zinc-800 !bg-zinc-950">
                  <TableHead className="text-xs uppercase tracking-wide !text-yellow-300">
                    <button
                      onClick={() => toggleSort("firstName")}
                      className="flex items-center gap-1"
                    >
                      Nombre{" "}
                      {sortBy === "firstName"
                        ? sortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide !text-yellow-300">
                    <button
                      onClick={() => toggleSort("lastName")}
                      className="flex items-center gap-1"
                    >
                      Apellidos{" "}
                      {sortBy === "lastName"
                        ? sortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide !text-yellow-300">
                    <button
                      onClick={() => toggleSort("plan")}
                      className="flex items-center gap-1"
                    >
                      Plan{" "}
                      {sortBy === "plan" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide !text-yellow-300">
                    <button
                      onClick={() => toggleSort("membershipStart")}
                      className="flex items-center gap-1"
                    >
                      Inicio{" "}
                      {sortBy === "membershipStart"
                        ? sortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide !text-yellow-300">
                    <button
                      onClick={() => toggleSort("membershipEnd")}
                      className="flex items-center gap-1"
                    >
                      Fin{" "}
                      {sortBy === "membershipEnd"
                        ? sortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide !text-yellow-300">Días</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide !text-yellow-300">DNI</TableHead>

                  {/* Columna opcional: Fecha de registro (si API la expone) */}
                  <TableHead className="text-xs uppercase tracking-wide !text-yellow-300">
                    <button
                      onClick={() => toggleSort("createdAt")}
                      className="flex items-center gap-1"
                    >
                      Registro{" "}
                      {sortBy === "createdAt"
                        ? sortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </button>
                  </TableHead>

                  <TableHead className="text-xs uppercase tracking-wide !text-yellow-300">Cobros</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide !text-yellow-300">Huella</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide !text-yellow-300">Operaciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => {
                    const uid = client.userId || client.id;
                    const has = fpStatus[uid] ?? Boolean(client.hasFingerprint);
                    const membershipDays = getMembershipDays(client.membershipEnd);
                    return (
                      <TableRow
                        key={client.id}
                        className="border-zinc-900 hover:bg-zinc-900/70"
                      >
                        <TableCell className="font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-yellow-400" />
                            {client.firstName}
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-300">{client.lastName}</TableCell>
                        <TableCell>
                          <span className="inline-flex rounded-md border border-zinc-800 bg-black px-2 py-1 text-xs font-semibold text-zinc-200">
                            {client.plan}
                          </span>
                        </TableCell>
                        <TableCell className="text-zinc-300">{client.membershipStart || "—"}</TableCell>
                        <TableCell className="text-zinc-300">{client.membershipEnd || "—"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-xs font-semibold ${membershipDays.className}`}>
                            {membershipDays.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-zinc-400">{client.documentNumber || "—"}</TableCell>
                        <TableCell className="text-zinc-400">{client.createdAt || "—"}</TableCell>
                        <TableCell>
                          <Button
                            onClick={() => {
                              setSelectedClientForDebt({
                                id: client.id,
                                name: `${client.firstName} ${client.lastName}`,
                                profileId: client.id, // Usar el profile_id del cliente
                              });
                              setShowDebtDialog(true);
                            }}
                            className="inline-flex items-center gap-2 bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500"
                          >
                            <BadgeDollarSign className="h-3.5 w-3.5" />
                            Cobros
                          </Button>
                        </TableCell>
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
                              className={`${busy[uid] ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-300"} bg-yellow-400 text-black`}
                              onClick={() => registerFingerprint(uid)}
                              disabled={!!busy[uid] || !!deleting[uid]}
                            >
                              {busy[uid] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              {has ? "Reemplazar huella" : "Registrar huella"}
                            </Button>

                            <Button
                              className={`!border-yellow-400 !bg-zinc-950 !text-yellow-300 hover:!bg-yellow-400 hover:!text-black ${
                                busy[uid] ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              onClick={() => verifyFingerprint(uid)}
                              disabled={!!busy[uid] || !!deleting[uid]}
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
                                    c.id === updated.id
                                      ? { ...c, ...updated }
                                      : c
                                  )
                                );
                                toast.success("Cliente actualizado");
                              }}
                            />

                            <Button
                              className="inline-flex items-center gap-2 !border-green-500 !bg-zinc-950 !text-green-300 hover:!bg-green-600 hover:!text-white"
                              onClick={() => sendCredentials(client)}
                              disabled={!!busy[client.id] || !!deleting[client.id]}
                              variant="outline"
                            >
                              <Send className="h-4 w-4" />
                              Credenciales
                            </Button>

                            <Button
                              className="inline-flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => handleDeleteClick(client.id)}
                              disabled={!!deleting[client.id] || isPageLoading}
                            >
                              {deleting[client.id] ? (
                                <span className="flex items-center gap-2">
                                  <BtnSpinner /> Eliminando…
                                </span>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4" />
                                  Eliminar
                                </>
                              )}
                            </Button>

                            <Button
                              className={`!border-red-500 !bg-zinc-950 !text-red-300 hover:!bg-red-600 hover:!text-white ${
                                busy[uid] ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              onClick={() => deleteFingerprint(uid)}
                              disabled={!!busy[uid] || !!deleting[uid]}
                              variant="outline"
                            >
                              Eliminar huella
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="py-10 text-center text-zinc-500">
                      No hay clientes disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-4 flex items-center gap-2 text-yellow-400">
          <UserRound className="h-5 w-5" />
          <h2 className="text-lg font-bold">Accesos pendientes</h2>
        </div>
        {pendingCredentials.length > 0 ? (
          pendingCredentials.map((cred, index) => (
            <div key={index} className="mb-3 rounded-lg border border-zinc-800 bg-black p-3">
              <div className="grid gap-1 text-sm text-zinc-300 md:grid-cols-3">
                <p><span className="text-zinc-500">Usuario</span><br />{cred.username}</p>
                <p><span className="text-zinc-500">Contraseña</span><br />{cred.password}</p>
                <p><span className="text-zinc-500">Teléfono</span><br />{cred.phone}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  className="bg-yellow-400 text-black hover:bg-yellow-300"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      cred.message || `Usuario: ${cred.username}\nContraseña: ${cred.password}\nTeléfono: ${cred.phone}`
                    );
                    toast.success("Credenciales copiadas al portapapeles.");
                  }}
                >
                  Copiar
                </Button>
                <Button
                  className="bg-green-600 text-white hover:bg-green-500"
                  onClick={() =>
                    window.open(
                      cred.whatsappUrl ||
                        `https://wa.me/${cred.phone}?text=${encodeURIComponent(
                          cred.message || `Usuario: ${cred.username}\nContraseña: ${cred.password}`
                        )}`,
                      "_blank"
                    )
                  }
                >
                  Abrir chat en WhatsApp
                </Button>
                <Button
                  className="bg-red-500 text-white hover:bg-red-600"
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
          <p className="rounded-md border border-dashed border-zinc-800 p-4 text-sm text-zinc-500">
            No hay accesos pendientes.
          </p>
        )}
      </section>
      </main>
      {isPageLoading && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3 bg-black/80 text-white px-4 py-3 rounded-lg border border-yellow-400">
            <BtnSpinner />
            <span>Procesando…</span>
          </div>
        </div>
      )}
      {showConfirm && (
        <ConfirmDialog
          message="¿Estás seguro de que deseas eliminar este cliente?"
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      
      {/* Diálogo de gestión de deudas */}
      {selectedClientForDebt && (
        <DebtManagement
          isOpen={showDebtDialog}
          onClose={() => {
            setShowDebtDialog(false);
            setSelectedClientForDebt(null);
          }}
          clientId={selectedClientForDebt.id}
          clientName={selectedClientForDebt.name}
          profileId={selectedClientForDebt.profileId}
        />
      )}
    </div>
  );
}

function ClientMetric({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  tone?: "default" | "yellow";
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className={`flex items-center gap-2 text-sm ${tone === "yellow" ? "text-yellow-400" : "text-zinc-400"}`}>
        {icon}
        {label}
      </div>
      <div className="mt-3 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

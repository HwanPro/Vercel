"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  BadgeDollarSign,
  Clock3,
  Clipboard,
  DoorOpen,
  ExternalLink,
  Fingerprint,
  Loader2,
  Phone,
  Radio,
  ShieldAlert,
  Tv,
  UserCheck,
} from "lucide-react";

const swalBase = {
  background: "#000",
  color: "#fff",
  confirmButtonColor: "#facc15",
} as const;

function vibrate(ms = 100) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {}
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha registrada";
  return new Date(value).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calcDisplayDaysLeft(value?: string | null) {
  if (!value) return null;
  const end = new Date(value);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  const floorToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.ceil((end.getTime() - floorToday.getTime()) / 86_400_000));
}

function isCheckInError(
  error: unknown,
): error is Error & { payload?: RegisterResult } {
  return error instanceof Error && "payload" in error;
}

type IdentifyResult = {
  ok: boolean;
  match: boolean;
  userId: string | null;
  name?: string;
  membershipExpired?: boolean;
  profileEndDate?: string | null;
  hasProfile?: boolean;
  message?: string;
};
type RegisterResult = {
  ok: boolean;
  action: "checkin" | "checkout" | "already_open";
  reason?: string;
  message?: string;
  fullName?: string;
  plan?: string | null;
  endDate?: string | null;
  minutesOpen?: number;
  monthlyDebt?: number;
  dailyDebt?: number;
  totalDebt?: number;
  daysLeft?: number;
  membershipExpired?: boolean;
  avatarUrl?: string;
  profileId?: string;
};

type ActivityLog = {
  id: string;
  timestamp: Date;
  fullName: string;
  action: "checkin" | "checkout";
  avatarUrl?: string;
  monthlyDebt: number;
  dailyDebt: number;
  daysLeft?: number;
  profileId?: string;
};

type ActiveGymMember = {
  id: string;
  userId: string;
  fullName: string;
  checkInTime: Date;
  minutesOpen: number;
  plan?: string | null;
  daysLeft?: number | null;
  monthlyDebt: number;
  dailyDebt: number;
  totalDebt: number;
  profileId?: string | null;
};

type DebtTarget = Pick<
  RegisterResult,
  "profileId" | "fullName" | "plan" | "daysLeft" | "monthlyDebt" | "dailyDebt" | "totalDebt"
> & {
  userId?: string;
};

export default function CheckInPage() {
  const { data: session } = useSession();

  // ----- modo / sala -----
  const [mode, setMode] = useState<"kiosk" | "remote">("kiosk"); // valor estable para SSR => NO hydration error
  const [room, setRoom] = useState("default");
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState("");

  // ----- estados para admin -----
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [showDebtDialog, setShowDebtDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<DebtTarget | null>(
    null,
  );
  const [activeGymMembers, setActiveGymMembers] = useState<ActiveGymMember[]>([]);

  // Cargar historial del día desde localStorage al montar
  useEffect(() => {
    if (mounted && session?.user?.role === "admin") {
      const today = new Date().toDateString();
      const savedLog = localStorage.getItem(`activityLog_${today}`);
      if (savedLog) {
        try {
          const parsedLog = JSON.parse(savedLog).map(
            (item: ActivityLog & { timestamp: string }) => ({
              ...item,
              timestamp: new Date(item.timestamp),
            }),
          );
          setActivityLog(parsedLog);
        } catch (error) {
          console.error("Error al cargar historial del día:", error);
        }
      }
    }
  }, [mounted, session?.user?.role]);

  // Guardar historial del día en localStorage cuando cambie
  useEffect(() => {
    if (mounted && session?.user?.role === "admin" && activityLog.length > 0) {
      const today = new Date().toDateString();
      localStorage.setItem(`activityLog_${today}`, JSON.stringify(activityLog));
    }
  }, [activityLog, mounted, session?.user?.role]);

  const refreshActiveGymMembers = async () => {
    try {
      const response = await fetch("/api/attendance", { cache: "no-store" });
      if (!response.ok) return;
      type AttendanceResponse = {
        id: string;
        userId: string;
        checkInTime: string;
        checkOutTime?: string | null;
        user?: { firstName?: string; lastName?: string; username?: string };
        profile?: {
          profileId?: string | null;
          plan?: string | null;
          endDate?: string | null;
          monthlyDebt?: number;
          dailyDebt?: number;
          totalDebt?: number;
        } | null;
      };
      const rows = (await response.json().catch(() => [])) as AttendanceResponse[];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const active = rows
        .filter((row) => !row.checkOutTime && new Date(row.checkInTime) >= todayStart)
        .map((row) => {
          const checkInTime = new Date(row.checkInTime);
          const fullName =
            `${row.user?.firstName || ""} ${row.user?.lastName || ""}`.trim() ||
            row.user?.username ||
            "Cliente";
          return {
            id: row.id,
            userId: row.userId,
            fullName,
            checkInTime,
            minutesOpen: Math.max(0, Math.round((Date.now() - checkInTime.getTime()) / 60000)),
            plan: row.profile?.plan ?? null,
            daysLeft: row.profile?.endDate ? Number(calcDisplayDaysLeft(row.profile.endDate)) : null,
            monthlyDebt: Number(row.profile?.monthlyDebt || 0),
            dailyDebt: Number(row.profile?.dailyDebt || 0),
            totalDebt: Number(row.profile?.totalDebt || 0),
            profileId: row.profile?.profileId ?? null,
          };
        })
        .sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime());
      setActiveGymMembers(active);
    } catch (error) {
      console.error("Error cargando clientes en el gym:", error);
    }
  };

  useEffect(() => {
    if (!mounted || session?.user?.role !== "admin") return;
    refreshActiveGymMembers();
    const timer = setInterval(refreshActiveGymMembers, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, session?.user?.role]);

  useEffect(() => {
    setMounted(true);
    const sp = new URLSearchParams(window.location.search);
    setOrigin(window.location.origin);
    setMode(sp.get("remote") ? "remote" : "kiosk");
    setRoom(sp.get("room") || "default");
  }, []);

  // ----- estados captura/escaneo -----
  const [loading, setLoading] = useState(false);
  const scanningRef = useRef(false);

  // ==================== utilidades ====================
  const askIdentifier = async (title: string): Promise<string | null> => {
    const { value, isConfirmed } = await Swal.fire({
      ...swalBase,
      title,
      input: "text",
      inputPlaceholder: "Teléfono o DNI",
      inputAttributes: { maxlength: "11", inputmode: "numeric" },
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
      preConfirm: (val) => {
        const v = String(val || "").replace(/\D/g, "");
        if (v.length !== 8 && v.length !== 9 && !(v.length === 11 && v.startsWith("51"))) {
          Swal.showValidationMessage("Ingresa DNI de 8 dígitos o teléfono de 9 dígitos");
          return false as any;
        }
        return v;
      },
    });
    return isConfirmed ? String(value).replace(/\D/g, "") : null;
  };

  // ── Fase 1: captura el dedo en polling hasta obtenerlo o que el usuario detenga ──
  const captureFingerprint = async (): Promise<string | null> => {
    const MAX = 12; // hasta ~60 s (5 s por intento en el C#)
    for (let i = 0; i < MAX; i++) {
      if (!scanningRef.current) return null;
      try {
        const r = await fetch("/api/biometric/capture", {
          method: "POST",
          cache: "no-store",
        });
        const j = (await r.json().catch(() => ({}))) as {
          ok?: boolean;
          template?: string;
          message?: string;
        };
        if (j?.ok && j?.template) return j.template;
        const message = j?.message || "";
        if (
          !r.ok &&
          /SDK|ZKFinger|ZK9500|driver|USB|lector|dispositivo|device/i.test(
            message,
          )
        ) {
          throw new Error(message);
        }
        // no hay dedo → pequeña pausa antes del siguiente intento
        await new Promise((res) => setTimeout(res, 300));
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (
          /SDK|ZKFinger|ZK9500|driver|USB|lector|dispositivo|device/i.test(
            message,
          )
        ) {
          throw error;
        }
        await new Promise((res) => setTimeout(res, 300));
      }
    }
    return null;
  };

  // ── Fase 2: identifica pasando el template ya capturado (1:N rápido) ──
  const identifyByTemplate = async (
    template: string,
  ): Promise<IdentifyResult> => {
    try {
      const r = await fetch("/api/biometric/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
        cache: "no-store",
      });
      const j = await r.json().catch(() => ({}));
      return {
        ok: r.ok,
        match: Boolean(j?.match),
        userId: j?.userId ?? j?.user_id ?? null,
        name: j?.fullName ?? j?.name,
        membershipExpired: Boolean(j?.membershipExpired),
        profileEndDate: j?.profileEndDate ?? null,
        hasProfile: j?.hasProfile,
        message: j?.message,
      };
    } catch {
      return { ok: false, match: false, userId: null };
    }
  };

  // ── Dialog de escaneo ──
  const showScanDialog = (tipo: "entrada" | "salida" | "deuda" = "entrada") => {
    const color = tipo === "salida" ? "#dc3545" : "#facc15";
    const title =
      tipo === "entrada"
        ? "Marcando entrada"
        : tipo === "salida"
          ? "Marcando salida"
          : "Buscando cliente para deuda";
    Swal.fire({
      ...swalBase,
      title,
      html: `
        <div style="text-align:center;padding:10px">
          <div style="position:relative;display:inline-block;margin:10px 0 24px">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
              width:80px;height:80px;border:3px solid ${color};border-radius:50%;
              animation:fpP 1.8s infinite;"></div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
              width:80px;height:80px;border:3px solid ${color};border-radius:50%;
              animation:fpP 1.8s .9s infinite;"></div>
            <div style="font-size:44px;position:relative;z-index:10;animation:fpB 1.5s infinite;color:${color}">●</div>
          </div>
          <p style="margin:0 0 4px;font-size:15px;color:#ddd">Coloca tu dedo en el lector ZK9500</p>
          <small style="opacity:.6;font-size:12px">Presiona firmemente y mantén quieto</small>
        </div>
        <style>
          @keyframes fpP{0%{transform:translate(-50%,-50%) scale(.8);opacity:1}
            100%{transform:translate(-50%,-50%) scale(1.9);opacity:0}}
          @keyframes fpB{0%,100%{transform:translateY(0)}40%{transform:translateY(-10px)}60%{transform:translateY(-5px)}}
        </style>`,
      allowOutsideClick: true,
      showConfirmButton: true,
      confirmButtonText: "Cancelar",
      showCancelButton: false,
      didOpen: () => {
        document
          .querySelector(".swal2-confirm")
          ?.addEventListener("click", () => {
            scanningRef.current = false;
            Swal.close();
          });
      },
    });
  };

  const register = async (payload: {
    userId?: string;
    phone?: string;
    identifier?: string;
    dni?: string;
    intent?: "checkin" | "checkout";
  }) => {
    const r = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const j = (await r
      .json()
      .catch(() => ({}) as RegisterResult)) as RegisterResult;
    if (!r.ok) {
      const error = new Error(
        j?.message || "No se pudo registrar la asistencia",
      ) as Error & {
        payload?: RegisterResult;
      };
      error.payload = j;
      throw error;
    }
    return j;
  };

  const showRenewalAlert = async (
    data: Partial<IdentifyResult & RegisterResult>,
  ) => {
    const name = (data.fullName || data.name || "Cliente").trim();
    const debt = Number(data.totalDebt || data.monthlyDebt || 0);
    await Swal.fire({
      ...swalBase,
      icon: "warning",
      title: "Renovación requerida",
      html: `
        <div style="text-align:left;display:grid;gap:12px">
          <div style="border:1px solid rgba(250,204,21,.35);background:#0b0b0b;padding:14px;border-radius:8px">
            <div style="font-size:18px;font-weight:700;color:#facc15">${name}</div>
            <div style="margin-top:4px;color:#d4d4d8">No se registró entrada. La membresía debe renovarse antes de acceder.</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="background:#18181b;padding:10px;border-radius:8px">
              <div style="font-size:11px;color:#a1a1aa;text-transform:uppercase">Venció</div>
              <div style="font-weight:700">${formatDate(data.endDate || data.profileEndDate)}</div>
            </div>
            <div style="background:#18181b;padding:10px;border-radius:8px">
              <div style="font-size:11px;color:#a1a1aa;text-transform:uppercase">Deuda</div>
              <div style="font-weight:700">S/. ${debt.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <style>
            .swal-confirm-black {
              color: #000 !important;
              font-weight: 700 !important;
            }
        </style>
      `,
      confirmButtonText: "Entendido",
      confirmButtonColor: "#facc15",
      customClass: {
        confirmButton: "swal-confirm-black",
      },
    });
  };

  // ==================== acciones principal ====================
  const showCard = async (data: RegisterResult, fallbackName?: string) => {
    const name = (data.fullName || fallbackName || "").trim();
    const isAdmin = session?.user?.role === "admin";

    // 👇 coerción robusta (si API manda string por Decimal)
    const monthlyDebtNum = data.monthlyDebt || 0;
    const dailyDebtNum = data.dailyDebt || 0;
    const totalDebtNum = data.totalDebt || 0;
    const daysLeftNum =
      data.daysLeft === null || data.daysLeft === undefined
        ? undefined
        : Number(data.daysLeft);

    const title =
      data.action === "checkout"
        ? `¡Hasta la próxima${name ? ", " + name : ""}!`
        : data.action === "already_open"
          ? `Entrada activa${name ? ": " + name : ""}`
          : `¡Bienvenido${name ? ", " + name : ""}!`;

    const avatar =
      data.avatarUrl ||
      "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=" +
        encodeURIComponent(name || "W G");

    const html = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${avatar}" style="width:64px;height:64px;border-radius:9999px;object-fit:cover" alt="avatar" />
        <div style="text-align:left">
          ${Number.isFinite(daysLeftNum) ? `<div>Días restantes: <b>${daysLeftNum}</b></div>` : ""}
          ${totalDebtNum > 0 ? `<div>Deuda total: <b>S/. ${totalDebtNum.toFixed(2)}</b></div>` : ""}
          ${isAdmin && monthlyDebtNum > 0 ? `<div>Deuda mensual: <b>S/. ${monthlyDebtNum.toFixed(2)}</b></div>` : ""}
          ${isAdmin && dailyDebtNum > 0 ? `<div>Deuda diaria: <b>S/. ${dailyDebtNum.toFixed(2)}</b></div>` : ""}
          ${
            data.action === "checkout" && Number.isFinite(data.minutesOpen)
              ? `<div>Sesión: ${data.minutesOpen} min</div>`
              : ""
          }
        </div>
      </div>`;

    // Agregar al log de actividad si es admin
    if (isAdmin) {
      const logEntry: ActivityLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        fullName: name,
        action: data.action === "checkout" ? "checkout" : "checkin",
        avatarUrl: data.avatarUrl,
        monthlyDebt: monthlyDebtNum,
        dailyDebt: dailyDebtNum,
        daysLeft: daysLeftNum || undefined,
        profileId: data.profileId,
      };
      setActivityLog((prev) => [logEntry, ...prev.slice(0, 49)]); // Mantener últimas 50 entradas
    }

    const result = await Swal.fire({
      ...swalBase,
      icon: "success",
      title,
      html,
      timer: isAdmin ? undefined : 2000,
      showConfirmButton: isAdmin && data.action === "checkin",
      confirmButtonText: isAdmin ? "Agregar Deuda" : undefined,
      showCancelButton: isAdmin,
      cancelButtonText: isAdmin ? "Cerrar" : undefined,
    });

    // Si es admin y confirmó, mostrar diálogo de deuda
    if (isAdmin && result.isConfirmed && data.profileId) {
      setSelectedClient(data);
      setShowDebtDialog(true);
    }
  };

  const lookupClientForDebt = async (payload: {
    userId?: string;
    identifier?: string;
  }): Promise<DebtTarget> => {
    const response = await fetch("/api/check-in/client-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok || !data?.profileId) {
      throw new Error(data?.message || "No se encontró un perfil para agregar deuda");
    }
    return {
      userId: data.userId,
      profileId: data.profileId,
      fullName: data.fullName,
      plan: data.plan,
      daysLeft: data.daysLeft,
      monthlyDebt: Number(data.monthlyDebt || 0),
      dailyDebt: Number(data.dailyDebt || 0),
      totalDebt: Number(data.totalDebt || 0),
    };
  };

  const startDebtScan = async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setLoading(true);

    showScanDialog("deuda");

    try {
      const template = await captureFingerprint();
      Swal.close();

      let target: DebtTarget | null = null;

      if (template && scanningRef.current) {
        const identified = await identifyByTemplate(template);
        if (identified.match && identified.userId) {
          target = await lookupClientForDebt({ userId: identified.userId });
        }
      }

      if (!target) {
        const identifier = await askIdentifier(
          "No te reconocimos. Busca por DNI o teléfono",
        );
        if (!identifier) return;
        target = await lookupClientForDebt({ identifier });
      }

      setSelectedClient(target);
      setShowDebtDialog(true);
    } catch (error) {
      await Swal.fire({
        ...swalBase,
        icon: "error",
        title: "No se pudo agregar deuda",
        text: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      });
    } finally {
      setLoading(false);
      scanningRef.current = false;
    }
  };

  const startAutoScan = async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setLoading(true);

    showScanDialog("entrada");

    try {
      // Fase 1: capturar el dedo (polling, hasta ~60 s)
      const template = await captureFingerprint();
      Swal.close();

      if (!template || !scanningRef.current) return;

      // Fase 2: identificar con el template capturado
      const res = await identifyByTemplate(template);

      // Fase 3: registrar entrada. Si está vencido, no se marca.
      if (res.match && res.userId) {
        if (res.membershipExpired) {
          vibrate(80);
          await showRenewalAlert(res);
          return;
        }
        const data = await register({ userId: res.userId, intent: "checkin" });
        vibrate(200);
        await showCard(data, res.name);
        await refreshActiveGymMembers();
      } else {
        const identifier = await askIdentifier(
          "No te reconocimos. Registra por teléfono o DNI",
        );
        if (!identifier) return;
        const data = await register({ identifier, intent: "checkin" });
        vibrate(200);
        await showCard(data);
        await refreshActiveGymMembers();
      }
    } catch (e: unknown) {
      vibrate(60);
      if (isCheckInError(e) && e.payload?.reason === "membership_expired") {
        await showRenewalAlert(e.payload);
      } else {
        await Swal.fire({
          ...swalBase,
          icon: "error",
          title: "No se pudo registrar la entrada",
          text: e instanceof Error ? e.message : "Inténtalo de nuevo.",
        });
      }
    } finally {
      setLoading(false);
      scanningRef.current = false;
    }
  };

  const forceCheckout = async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setLoading(true);

    showScanDialog("salida");

    try {
      // Fase 1: capturar el dedo (polling, hasta ~60 s)
      const template = await captureFingerprint();
      Swal.close();

      if (!template || !scanningRef.current) return;

      // Fase 2: identificar con el template capturado
      const res = await identifyByTemplate(template);

      // Fase 3: registrar salida
      if (res.match && res.userId) {
        const data = await register({ userId: res.userId, intent: "checkout" });
        vibrate(200);
        await showCard(data, res.name);
        await refreshActiveGymMembers();
      } else {
        const identifier = await askIdentifier("No te reconocimos. Salida por teléfono o DNI");
        if (!identifier) return;
        const data = await register({ identifier, intent: "checkout" });
        vibrate(200);
        await showCard(data);
        await refreshActiveGymMembers();
      }
    } catch (e: unknown) {
      vibrate(60);
      await Swal.fire({
        ...swalBase,
        icon: "error",
        title: "No se pudo registrar la salida",
        text: e instanceof Error ? e.message : "Inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
      scanningRef.current = false;
    }
  };

  // ==================== Panel: escucha comandos ====================
  useEffect(() => {
    if (!mounted || mode !== "kiosk") return;
    const ev = new EventSource(
      `/api/commands?room=${encodeURIComponent(room)}`,
    );
    ev.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data || "{}");
        if (data.action === "scan") startAutoScan();
        if (data.action === "checkout") forceCheckout();
        if (data.action === "stop") {
          scanningRef.current = false;
          setLoading(false);
          Swal.close();
        }
      } catch {}
    };
    ev.onerror = () => {
      /* mantener abierta la conexión */
    };
    return () => ev.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, mode, room]);

  // ==================== remote: envía comandos ====================
  const sendCommand = async (action: "scan" | "checkout" | "stop") => {
    await fetch("/api/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room, action }),
    }).catch(() => {});
  };

  // Función para agregar deuda
  const addDebt = async (
    productType: string,
    customAmount?: number,
    customName?: string,
  ) => {
    if (!selectedClient?.profileId) return;

    try {
      const response = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientProfileId: selectedClient.profileId,
          productType,
          quantity: 1,
          customAmount,
          customName,
        }),
      });

      if (response.ok) {
        await Swal.fire({
          ...swalBase,
          icon: "success",
          title: "Deuda agregada",
          timer: 1500,
          showConfirmButton: false,
        });
        setShowDebtDialog(false);
        setSelectedClient(null);
        await refreshActiveGymMembers();
      } else {
        throw new Error("Error al agregar deuda");
      }
    } catch (error) {
      await Swal.fire({
        ...swalBase,
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "No se pudo agregar la deuda",
      });
    }
  };

  const isAdmin = session?.user?.role === "admin";
  const gymActivity = useMemo(() => {
    const activeProfileIds = new Set(
      activeGymMembers.map((member) => member.profileId).filter(Boolean),
    );
    const activeItems = activeGymMembers.map((member) => ({
      id: `active-${member.id}`,
      fullName: member.fullName,
      status: "Dentro" as const,
      timestamp: member.checkInTime,
      minutesOpen: member.minutesOpen,
      plan: member.plan,
      daysLeft: member.daysLeft,
      monthlyDebt: member.monthlyDebt,
      dailyDebt: member.dailyDebt,
      totalDebt: member.totalDebt,
      profileId: member.profileId,
    }));
    const recentItems = activityLog
      .filter((log) => !log.profileId || !activeProfileIds.has(log.profileId))
      .slice(0, 12)
      .map((log) => ({
        id: `recent-${log.id}`,
        fullName: log.fullName,
        status: log.action === "checkin" ? ("Entrada" as const) : ("Salida" as const),
        timestamp: log.timestamp,
        minutesOpen: null,
        plan: null,
        daysLeft: log.daysLeft ?? null,
        monthlyDebt: log.monthlyDebt,
        dailyDebt: log.dailyDebt,
        totalDebt: log.monthlyDebt + log.dailyDebt,
        profileId: log.profileId,
      }));

    return [...activeItems, ...recentItems];
  }, [activeGymMembers, activityLog]);

  // ==================== UI ====================
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800/90 bg-black/95 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 text-yellow-400">
              <Fingerprint className="h-7 w-7" />
              <h1 className="text-2xl font-black tracking-normal md:text-3xl">
                Recepción Wolf Gym
              </h1>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-2 rounded-md border border-zinc-800 px-2.5 py-1">
                <Radio className="h-3.5 w-3.5 text-yellow-400" />
                {mode === "remote" ? "Control remoto" : "Panel local"}
              </span>
              <span className="rounded-md border border-zinc-800 px-2.5 py-1">
                Sala {room}
              </span>
              {loading && (
                <span className="inline-flex items-center gap-2 rounded-md border border-yellow-400/40 px-2.5 py-1 text-yellow-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Escaneando
                </span>
              )}
            </div>
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

      <main
        className={`mx-auto grid max-w-7xl gap-6 p-4 md:p-8 ${isAdmin ? "min-[1180px]:grid-cols-[minmax(0,1fr)_430px]" : "min-h-[calc(100vh-96px)] place-items-center"}`}
      >
        <section
          className={`${isAdmin ? "" : "w-full max-w-3xl"} flex flex-col justify-center gap-6`}
        >
          {mode === "kiosk" ? (
            <>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.18em] text-yellow-400/80">
                  Control de acceso
                </p>
                <h2 className="text-4xl font-black tracking-normal md:text-6xl">
                  Entrada y salida con huella.
                </h2>
                <p className="max-w-2xl text-base text-zinc-400">
                  Si el plan está vencido, se mostrará la alerta de renovación y
                  no se marcará entrada.
                </p>
              </div>

              <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={startAutoScan}
                  className="group inline-flex min-h-24 items-center justify-center gap-3 rounded-lg bg-yellow-400 px-6 py-5 text-lg font-black text-black transition hover:bg-yellow-300 disabled:opacity-60"
                  disabled={loading}
                >
                  <Fingerprint className="h-6 w-6 transition group-hover:scale-110" />
                  Marcar entrada
                </button>

                <button
                  onClick={forceCheckout}
                  className="inline-flex min-h-24 items-center justify-center gap-3 rounded-lg bg-red-600 px-6 py-5 text-lg font-black text-white transition hover:bg-red-500 disabled:opacity-60"
                  disabled={loading}
                >
                  <DoorOpen className="h-6 w-6" />
                  Marcar salida
                </button>

                <button
                  onClick={startDebtScan}
                  disabled={loading || !isAdmin}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/60 bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <BadgeDollarSign className="h-4 w-4" />
                  Agregar deuda
                </button>

                <button
                  onClick={async () => {
                    try {
                      const identifier = await askIdentifier(
                        "Ingresa tu teléfono o DNI para registrar asistencia",
                      );
                      if (!identifier) return;
                      const data = await register({ identifier, intent: "checkin" });
                      vibrate(200);
                      await showCard(data);
                    } catch (e: unknown) {
                      console.error("Error en registro por teléfono:", e);
                      if (
                        isCheckInError(e) &&
                        e.payload?.reason === "membership_expired"
                      ) {
                        await showRenewalAlert(e.payload);
                      } else {
                        await Swal.fire({
                          ...swalBase,
                          icon: "error",
                          title: "Error",
                          text:
                            e instanceof Error
                              ? e.message
                              : "Inténtalo de nuevo.",
                        });
                      }
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-yellow-400/40 bg-black px-6 py-4 font-semibold text-yellow-300 transition hover:bg-yellow-400/10"
                >
                  <Phone className="h-4 w-4" />
                  Registrar por teléfono/DNI
                </button>
              </div>

              {isAdmin && (
                <div className="w-full max-w-xl rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-3 flex items-center gap-2 text-yellow-400">
                    <Tv className="h-4 w-4" />
                    <h3 className="font-semibold">Pantalla de visualización</h3>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={`${origin}/check-in/display?room=${room}`}
                      readOnly
                      className="flex-1 rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200"
                    />
                    <button
                      onClick={() => {
                        const link = `${origin}/check-in/display?room=${room}`;
                        navigator.clipboard.writeText(link);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-800 px-3 py-2 text-sm text-white hover:bg-zinc-700"
                    >
                      <Clipboard className="h-4 w-4" />
                      Copiar
                    </button>
                    <button
                      onClick={() => {
                        const link = `${origin}/check-in/display?room=${room}`;
                        window.open(link, "_blank");
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-yellow-400 px-3 py-2 text-sm font-semibold text-black hover:bg-yellow-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            // ====== Panel de control remoto ======
            <div className="grid w-full max-w-md grid-cols-1 gap-3">
              <button
                onClick={() => sendCommand("scan")}
                className="inline-flex items-center justify-center gap-3 rounded-lg bg-yellow-400 px-6 py-4 text-lg font-black text-black hover:bg-yellow-300"
              >
                <Fingerprint className="h-5 w-5" />
                Escanear entrada
              </button>
              <button
                onClick={() => sendCommand("checkout")}
                className="inline-flex items-center justify-center gap-3 rounded-lg bg-red-600 px-6 py-4 text-lg font-black text-white hover:bg-red-500"
              >
                <DoorOpen className="h-5 w-5" />
                Marcar salida
              </button>
              <button
                onClick={startDebtScan}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500 bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
              >
                <BadgeDollarSign className="h-4 w-4" />
                Agregar deuda
              </button>

              <p className="text-gray-400 text-xs mt-1">
                Abre <code>/check-in?room=nombre</code> en la PC/monitor (Panel)
                y <code>/check-in?remote=1&room=nombre</code> en el celular
                (control).
              </p>
            </div>
          )}
        </section>

        {isAdmin && (
          <aside className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-yellow-400">
                  Actividad del gym
                </h2>
                <p className="text-sm text-zinc-500">
                  {activeGymMembers.length} dentro ahora · {activityLog.length} marcaciones recientes
                </p>
              </div>
              <div className="flex items-center gap-2 text-yellow-400">
                <ShieldAlert className="h-5 w-5" />
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {gymActivity.length === 0 ? (
                <p className="rounded-md border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
                  No hay actividad ni clientes dentro ahora
                </p>
              ) : (
                <div className="space-y-3">
                  {gymActivity.map((item) => (
                    <div key={item.id} className="rounded-lg border border-zinc-800 bg-black p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-white">{item.fullName}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                            <span
                              className={`rounded px-2 py-1 font-bold ${
                                item.status === "Dentro"
                                  ? "bg-yellow-400 text-black"
                                  : item.status === "Salida"
                                    ? "bg-red-600 text-white"
                                    : "bg-zinc-800 text-yellow-300"
                              }`}
                            >
                              {item.status}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5 text-yellow-400" />
                              {item.status === "Dentro" ? "Entró" : "Marcó"}{" "}
                              {item.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        {item.minutesOpen !== null && (
                          <span className="rounded-md bg-yellow-400 px-2 py-1 text-xs font-bold text-black">
                            {item.minutesOpen} min
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3 text-xs">
                        <div>
                          <p className="text-zinc-500">Plan</p>
                          <p className="mt-1 font-semibold text-zinc-100">{item.plan || "Sin plan"}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Días</p>
                          <p className="mt-1 font-semibold text-zinc-100">
                            {item.daysLeft === null || item.daysLeft === undefined
                              ? "Sin fecha"
                              : `${item.daysLeft} restantes`}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Deuda mensual</p>
                          <p className={item.monthlyDebt > 0 ? "mt-1 font-bold text-red-300" : "mt-1 font-semibold text-green-300"}>
                            S/. {item.monthlyDebt.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Deuda diaria</p>
                          <p className={item.dailyDebt > 0 ? "mt-1 font-bold text-red-300" : "mt-1 font-semibold text-green-300"}>
                            S/. {item.dailyDebt.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`mt-3 rounded-md px-3 py-2 text-sm font-black ${
                          item.totalDebt > 0
                            ? "bg-red-500/15 text-red-200"
                            : "bg-green-500/10 text-green-300"
                        }`}
                      >
                        {item.totalDebt > 0
                          ? `Debe S/. ${item.totalDebt.toFixed(2)}`
                          : "Sin deuda"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </main>

      {/* Diálogo de deuda */}
      {showDebtDialog && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">
              Agregar Deuda - {selectedClient.fullName}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => addDebt("WATER_1_5")}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Agua S/. 1.50
              </button>
              <button
                onClick={() => addDebt("WATER_2_5")}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Agua S/. 2.50
              </button>
              <button
                onClick={() => addDebt("WATER_3_5")}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Agua S/. 3.50
              </button>
              <button
                onClick={() => addDebt("PROTEIN_5")}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                Proteína S/. 5
              </button>
              <button
                onClick={() => addDebt("PRE_WORKOUT_3")}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
              >
                Pre S/. 3
              </button>
              <button
                onClick={() => addDebt("PRE_WORKOUT_5")}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
              >
                Pre S/. 5
              </button>
              <button
                onClick={() => addDebt("PRE_WORKOUT_10")}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
              >
                Pre S/. 10
              </button>
              <button
                onClick={async () => {
                  const { value: customData } = await Swal.fire({
                    ...swalBase,
                    title: "Producto personalizado",
                    html: `
                      <input id="customName" class="swal2-input" placeholder="Nombre del producto">
                      <input id="customAmount" class="swal2-input" type="number" step="0.01" placeholder="Precio">
                    `,
                    focusConfirm: false,
                    preConfirm: () => {
                      const name = (
                        document.getElementById(
                          "customName",
                        ) as HTMLInputElement
                      )?.value;
                      const amount = parseFloat(
                        (
                          document.getElementById(
                            "customAmount",
                          ) as HTMLInputElement
                        )?.value || "0",
                      );
                      if (!name || amount <= 0) {
                        Swal.showValidationMessage(
                          "Ingresa nombre y precio válidos",
                        );
                        return false;
                      }
                      return { name, amount };
                    },
                  });
                  if (customData) {
                    addDebt("CUSTOM", customData.amount, customData.name);
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded col-span-2"
              >
                Producto personalizado
              </button>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowDebtDialog(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import ProfileModal from "@/ui/components/ProfileModal";
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  Crown,
  Dumbbell,
  Edit2,
  LogOut,
  Phone,
  Salad,
  ShieldAlert,
} from "lucide-react";
import RoutineTab from "@/ui/components/RoutineTab";
import NutricionTab from "@/ui/components/NutricionTab";

interface Membership {
  membership_type: string;
  membership_duration: number;
}

interface UserMembership {
  membership: Membership;
  assignedAt: string;
}

interface Attendance {
  checkInTime: string;
  checkOutTime?: string | null;
}

interface ClientProfile {
  profile_first_name: string | null;
  profile_last_name: string | null;
  profile_plan: string | null;
  profile_start_date: string | null;
  profile_end_date: string | null;
  profile_emergency_phone: string | null;
  profile_phone: string | null;
  documentNumber?: string | null;
  debt?: string | number | null;
  gender?: "male" | "female";
}

interface ClientData {
  id: string;
  username: string;
  name: string;
  lastName: string;
  phoneNumber: string;
  image: string | null;
  role: string;
  profile?: ClientProfile | null;
  memberships?: UserMembership[];
  attendances?: Attendance[];
}

interface SubscriptionState {
  active: boolean;
  plan: string;
  startDate: Date | null;
  endDate: Date | null;
}

function formatDate(date?: Date | string | null) {
  if (!date) return "Sin fecha";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
}

function getDaysRemaining(endDate: Date | null) {
  if (!endDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000));
}

function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.charAt(0) || "W"}${lastName?.charAt(0) || "G"}`.toUpperCase();
}

const W = {
  black: "#0A0A0A",
  ink: "#141414",
  graph: "#1C1C1C",
  yellow: "#FFC21A",
  orange: "#FF7A1A",
  danger: "#E5484D",
  success: "#2EBD75",
  line: "rgba(255,194,26,0.15)",
  lineStrong: "rgba(255,194,26,0.35)",
  muted: "rgba(255,255,255,0.60)",
  faint: "rgba(255,255,255,0.40)",
  font: "'Inter', system-ui, sans-serif",
  display: "'Bebas Neue', 'Arial Narrow', sans-serif",
};

export default function ClientDashboard() {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fitnessGoal, setFitnessGoal] = useState<string>("strength");
  const [bodyFocus, setBodyFocus] = useState<string>("full");
  const router = useRouter();

  const fetchClientData = async () => {
    try {
      setErrorMessage(null);
      const res = await fetch("/api/user/me", { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) { router.push("/"); return; }
        throw new Error(data?.error || "Error al obtener datos del cliente");
      }
      setClientData(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
    const interval = window.setInterval(fetchClientData, 30_000);
    return () => window.clearInterval(interval);
  }, [router]);

  const subscription: SubscriptionState = useMemo(() => {
    if (clientData?.memberships?.length) {
      const membership = clientData.memberships[0];
      const startDate = new Date(membership.assignedAt);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + membership.membership.membership_duration);
      return { active: endDate.getTime() >= Date.now(), plan: membership.membership.membership_type, startDate, endDate };
    }
    if (clientData?.profile?.profile_plan && clientData.profile.profile_end_date) {
      const startDate = clientData.profile.profile_start_date ? new Date(clientData.profile.profile_start_date) : null;
      const endDate = new Date(clientData.profile.profile_end_date);
      return { active: endDate.getTime() >= new Date().setHours(0, 0, 0, 0), plan: clientData.profile.profile_plan, startDate, endDate };
    }
    return { active: false, plan: "Sin plan", startDate: null, endDate: null };
  }, [clientData]);

  const weeklyProgress = useMemo(() => {
    if (!clientData?.attendances?.length) return 0;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    return clientData.attendances.filter((attendance) => {
      const checkIn = new Date(attendance.checkInTime);
      return checkIn >= startOfWeek && checkIn <= now;
    }).length;
  }, [clientData?.attendances]);

  if (isLoading) {
    return (
      <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", background: W.black, color: "#fff", fontFamily: W.font }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${W.yellow}`, borderRight: "2px solid transparent", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          <p style={{ marginTop: 16, fontSize: 13, color: W.faint }}>Cargando perfil</p>
          <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
        </div>
      </main>
    );
  }

  if (!clientData || errorMessage) {
    return (
      <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", background: W.black, color: "#fff", fontFamily: W.font, padding: 24 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
        <div style={{ maxWidth: 360, background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.3)", borderRadius: 14, padding: 28, textAlign: "center" }}>
          <ShieldAlert style={{ width: 32, height: 32, color: W.danger, margin: "0 auto 12px" }} />
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>No se pudo cargar tu perfil</h1>
          <p style={{ fontSize: 13, color: "rgba(255,100,100,0.8)", margin: "0 0 16px" }}>{errorMessage || "Sesión no disponible"}</p>
          <Button
            style={{ height: 40, background: W.yellow, border: `1px solid ${W.yellow}`, borderRadius: 10, color: W.black, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "0 20px" }}
            onClick={fetchClientData}
          >
            Reintentar
          </Button>
        </div>
      </main>
    );
  }

  const firstName = clientData.profile?.profile_first_name || clientData.name;
  const lastName = clientData.profile?.profile_last_name || clientData.lastName;
  const daysRemaining = getDaysRemaining(subscription.endDate);
  const debt = Number(clientData.profile?.debt || 0);

  return (
    <main style={{ minHeight: "100vh", background: W.black, color: "#fff", fontFamily: W.font }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "16px 20px 40px" }}>

        {/* Top nav */}
        <header style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${W.line}`, paddingBottom: 20, marginBottom: 24 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: W.yellow, textDecoration: "none" }}>
            <ChevronLeft style={{ width: 16, height: 16 }} />Inicio
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setProfileModalOpen(true)}
              style={{ height: 40, background: W.yellow, border: `1px solid ${W.yellow}`, borderRadius: 10, color: W.black, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: "0 14px" }}
            >
              <Edit2 style={{ width: 15, height: 15 }} />Editar perfil
            </button>
            <button
              onClick={() => signOut()}
              style={{ height: 40, background: "transparent", border: `1px solid ${W.lineStrong}`, borderRadius: 10, color: W.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: "0 14px" }}
            >
              <LogOut style={{ width: 15, height: 15 }} />Cerrar sesión
            </button>
          </div>
        </header>

        {/* Hero row */}
        <section style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 20, marginBottom: 20 }}>
          {/* Avatar + info card */}
          <div style={{ background: W.ink, border: `1px solid ${W.line}`, borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
              {/* Avatar */}
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: "50%",
                  background: W.yellow,
                  border: `2px solid ${W.yellow}`,
                  flexShrink: 0,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {clientData.image ? (
                  <img src={clientData.image} alt="Perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontFamily: W.display, fontSize: 28, color: W.black, letterSpacing: "0.04em" }}>
                    {getInitials(firstName, lastName)}
                  </span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                {/* Status badge */}
                <span style={{
                  display: "inline-flex", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8,
                  background: subscription.active ? "rgba(46,189,117,0.12)" : "rgba(229,72,77,0.12)",
                  color: subscription.active ? W.success : W.danger,
                  border: subscription.active ? "1px solid rgba(46,189,117,0.35)" : "1px solid rgba(229,72,77,0.35)",
                }}>
                  {subscription.active ? "Membresía vigente" : "Membresía pendiente"}
                </span>
                <h1 style={{ fontFamily: W.display, fontSize: 48, color: "#fff", margin: "0 0 10px", lineHeight: 1, letterSpacing: "0.02em", wordBreak: "break-word" }}>
                  {firstName} {lastName}
                </h1>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, border: `1px solid ${W.line}`, padding: "4px 10px", fontSize: 12, color: W.muted }}>
                    <Phone style={{ width: 12, height: 12, color: W.yellow }} />
                    {clientData.profile?.profile_phone || clientData.phoneNumber || "Sin teléfono"}
                  </span>
                  <span style={{ borderRadius: 999, border: `1px solid ${W.line}`, padding: "4px 10px", fontSize: 12, color: W.muted }}>
                    DNI {clientData.profile?.documentNumber || "no registrado"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status tiles */}
          <div style={{ display: "grid", gap: 14 }}>
            <StatusTile icon={<Crown style={{ width: 15, height: 15 }} />} label="Plan" value={subscription.plan} />
            <StatusTile icon={<CalendarDays style={{ width: 15, height: 15 }} />} label="Vence" value={formatDate(subscription.endDate)} />
            <StatusTile icon={<Clock style={{ width: 15, height: 15 }} />} label="Días restantes" value={`${daysRemaining}`} tone={daysRemaining <= 7 ? "warn" : "ok"} />
          </div>
        </section>

        {/* Info bands */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
          <InfoBand label="Entrenos esta semana" value={`${weeklyProgress}/3`} />
          <InfoBand label="Inicio de membresía" value={formatDate(subscription.startDate)} />
          <InfoBand label="Deuda" value={`S/. ${debt.toFixed(2)}`} tone={debt > 0 ? "warn" : "default"} />
        </section>

        {isProfileModalOpen && (
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            onSuccess={fetchClientData}
            userName={clientData.username}
            firstName={firstName}
            userLastName={lastName}
            userPhone={clientData.profile?.profile_phone || ""}
            userEmergencyPhone={clientData.profile?.profile_emergency_phone || ""}
            userRole={clientData.role}
            profileImage={clientData.image}
          />
        )}

        {/* Tabs */}
        {subscription.active ? (
          <section style={{ background: W.ink, border: `1px solid ${W.line}`, borderRadius: 14, overflow: "hidden" }}>
            <Tabs defaultValue="routines" className="w-full">
              <TabsList className="grid h-auto grid-cols-2 rounded-none border-b border-zinc-800 bg-black p-1">
                <TabsTrigger value="routines" className="min-h-11 gap-2 rounded-md text-zinc-300 data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
                  <Dumbbell className="h-4 w-4" />Rutinas
                </TabsTrigger>
                <TabsTrigger value="nutrition" className="min-h-11 gap-2 rounded-md text-zinc-300 data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
                  <Salad className="h-4 w-4" />Nutrición
                </TabsTrigger>
              </TabsList>
              <TabsContent value="routines" className="m-0">
                <RoutineTab gender={clientData.profile?.gender || "male"} fitnessGoal={fitnessGoal} bodyFocus={bodyFocus} setFitnessGoal={setFitnessGoal} setBodyFocus={setBodyFocus} />
              </TabsContent>
              <TabsContent value="nutrition" className="m-0 p-4 sm:p-6">
                <NutricionTab gender={clientData.profile?.gender || "male"} />
              </TabsContent>
            </Tabs>
          </section>
        ) : (
          <section style={{ background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.3)", borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <ShieldAlert style={{ width: 20, height: 20, flexShrink: 0, color: W.danger, marginTop: 2 }} />
              <div>
                <h2 style={{ fontWeight: 700, color: "rgba(255,150,150,0.9)", margin: "0 0 6px" }}>Membresía no activa</h2>
                <p style={{ fontSize: 13, color: "rgba(255,100,100,0.7)", margin: 0 }}>
                  Acércate a recepción para renovar tu plan y habilitar tus rutinas.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StatusTile({ icon, label, value, tone = "default" }: { icon: ReactNode; label: string; value: string; tone?: "default" | "ok" | "warn"; }) {
  const valueColor = tone === "ok" ? "#2EBD75" : tone === "warn" ? "#FF7A1A" : "#fff";
  return (
    <div style={{ background: "#141414", border: "1px solid rgba(255,194,26,0.15)", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
        {icon}{label}
      </div>
      <p style={{ fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif", fontSize: 24, color: valueColor, margin: 0, letterSpacing: "0.02em" }}>{value}</p>
    </div>
  );
}

function InfoBand({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "warn"; }) {
  return (
    <div style={{ background: "#141414", border: "1px solid rgba(255,194,26,0.15)", borderRadius: 12, padding: "12px 16px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif", fontSize: 22, color: tone === "warn" ? "#FF7A1A" : "#fff", margin: 0, letterSpacing: "0.02em" }}>{value}</p>
    </div>
  );
}

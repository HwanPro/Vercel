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
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
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
      const res = await fetch("/api/user/me", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/");
          return;
        }
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
      return {
        active: endDate.getTime() >= Date.now(),
        plan: membership.membership.membership_type,
        startDate,
        endDate,
      };
    }

    if (clientData?.profile?.profile_plan && clientData.profile.profile_end_date) {
      const startDate = clientData.profile.profile_start_date
        ? new Date(clientData.profile.profile_start_date)
        : null;
      const endDate = new Date(clientData.profile.profile_end_date);
      return {
        active: endDate.getTime() >= new Date().setHours(0, 0, 0, 0),
        plan: clientData.profile.profile_plan,
        startDate,
        endDate,
      };
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
      <main className="grid min-h-screen place-items-center bg-black px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-yellow-400 border-r-transparent" />
          <p className="mt-4 text-sm text-zinc-400">Cargando perfil</p>
        </div>
      </main>
    );
  }

  if (!clientData || errorMessage) {
    return (
      <main className="grid min-h-screen place-items-center bg-black px-4 text-white">
        <div className="max-w-sm rounded-lg border border-red-500/30 bg-red-950/20 p-5 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-red-300" />
          <h1 className="mt-3 text-lg font-bold">No se pudo cargar tu perfil</h1>
          <p className="mt-2 text-sm text-red-100/80">{errorMessage || "Sesión no disponible"}</p>
          <Button className="mt-4 bg-yellow-400 text-black hover:bg-yellow-300" onClick={fetchClientData}>
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
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-zinc-900 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-yellow-300">
            <ChevronLeft className="h-4 w-4" />
            Inicio
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="h-10 bg-yellow-400 text-black hover:bg-yellow-300"
              onClick={() => setProfileModalOpen(true)}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Editar perfil
            </Button>
            <Button
              variant="outline"
              className="h-10 !border-zinc-700 !bg-zinc-950 !text-zinc-100 hover:!bg-zinc-900"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </header>

        <section className="grid gap-5 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-yellow-400 bg-yellow-400 text-black">
                {clientData.image ? (
                  <img src={clientData.image} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl font-black">
                    {getInitials(firstName, lastName)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-wide text-yellow-300">
                  {subscription.active ? "Membresía vigente" : "Membresía pendiente"}
                </p>
                <h1 className="mt-1 break-words text-3xl font-black leading-tight sm:text-4xl">
                  {firstName} {lastName}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-300">
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1">
                    <Phone className="h-3.5 w-3.5 text-yellow-300" />
                    {clientData.profile?.profile_phone || clientData.phoneNumber || "Sin teléfono"}
                  </span>
                  <span className="rounded-full border border-zinc-800 px-3 py-1">
                    DNI {clientData.profile?.documentNumber || "no registrado"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StatusTile icon={<Crown className="h-4 w-4" />} label="Plan" value={subscription.plan} />
            <StatusTile icon={<CalendarDays className="h-4 w-4" />} label="Vence" value={formatDate(subscription.endDate)} />
            <StatusTile icon={<Clock className="h-4 w-4" />} label="Días" value={`${daysRemaining}`} tone={daysRemaining <= 7 ? "warn" : "ok"} />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <InfoBand label="Entrenos esta semana" value={`${weeklyProgress}/3`} />
          <InfoBand label="Inicio" value={formatDate(subscription.startDate)} />
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
            userDocumentNumber={clientData.profile?.documentNumber || ""}
            userRole={clientData.role}
            profileImage={clientData.image}
          />
        )}

        {subscription.active ? (
          <section className="mt-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
            <Tabs defaultValue="routines" className="w-full">
              <TabsList className="grid h-auto grid-cols-2 rounded-none border-b border-zinc-800 bg-black p-1">
                <TabsTrigger
                  value="routines"
                  className="min-h-11 gap-2 rounded-md text-zinc-300 data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
                >
                  <Dumbbell className="h-4 w-4" />
                  Rutinas
                </TabsTrigger>
                <TabsTrigger
                  value="nutrition"
                  className="min-h-11 gap-2 rounded-md text-zinc-300 data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
                >
                  <Salad className="h-4 w-4" />
                  Nutrición
                </TabsTrigger>
              </TabsList>

              <TabsContent value="routines" className="m-0">
                <RoutineTab
                  gender={clientData.profile?.gender || "male"}
                  fitnessGoal={fitnessGoal}
                  bodyFocus={bodyFocus}
                  setFitnessGoal={setFitnessGoal}
                  setBodyFocus={setBodyFocus}
                />
              </TabsContent>

              <TabsContent value="nutrition" className="m-0 p-4 sm:p-6">
                <NutricionTab gender={clientData.profile?.gender || "male"} />
              </TabsContent>
            </Tabs>
          </section>
        ) : (
          <section className="mt-6 rounded-lg border border-red-500/30 bg-red-950/20 p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-red-300" />
              <div>
                <h2 className="font-bold text-red-100">Membresía no activa</h2>
                <p className="mt-1 text-sm text-red-100/70">
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

function StatusTile({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn";
}) {
  const toneClass =
    tone === "ok"
      ? "text-green-300"
      : tone === "warn"
        ? "text-amber-200"
        : "text-white";
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        {icon}
        {label}
      </div>
      <p className={`mt-2 text-xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function InfoBand({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-black ${tone === "warn" ? "text-amber-200" : "text-white"}`}>{value}</p>
    </div>
  );
}

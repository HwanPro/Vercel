"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ProfileModal from "@/components/ProfileModal";
import { Home, Crown, Edit2, LogOut, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import RoutineTab from "@/components/RoutineTab";
import NutricionTab from "@/components/NutricionTab";
import ProgressTab from "@/components/ProgressTab";

interface Membership {
  membership_type: string;
  membership_duration: number;
  membership_cost: number;
}

interface UserMembership {
  membership: Membership;
  assignedAt: string;
}

interface Attendance {
  checkInTime: string;
}

interface ClientProfile {
  profile_first_name: string;
  profile_last_name: string;
  profile_plan: string | null;
  profile_start_date: string | null;
  profile_end_date: string | null;
  profile_emergency_phone: string | null;
  profile_phone: string | null;
  gender: "male" | "female";
}

interface ClientData {
  id: string;
  name: string;
  lastName: string;
  email: string;
  image: string | null;
  role: string;
  profile: ClientProfile | null;
  memberships: UserMembership[];
  attendances: Attendance[];
}

export default function ClientDashboard() {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
  const [fitnessGoal, setFitnessGoal] = useState<string>("strength");
  const [bodyFocus, setBodyFocus] = useState<string>("full");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carga inicial de datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/clients", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Error al obtener datos del cliente");
        const data = await res.json();
        setClientData(data);
        // ... cargar otros datos, etc.
      } catch (error: any) {
        console.error("❌ Error en la carga de datos:", error);
        setErrorMessage(error.message || "Error al cargar datos");
      }
    };
    fetchData();
  }, []);

  if (!clientData) return <p>Cargando datos...</p>;
  if (errorMessage) return <p className="text-red-500">{errorMessage}</p>;

  // Lógica de suscripción (memberships o profile_plan)
  const subscription = (() => {
    if (clientData.memberships && clientData.memberships.length > 0) {
      const membership = clientData.memberships[0];
      const startDate = new Date(membership.assignedAt);
      const endDate = new Date(
        startDate.getTime() +
          membership.membership.membership_duration * 24 * 3600 * 1000
      );
      return {
        active: true,
        plan: membership.membership.membership_type,
        startDate,
        endDate,
      };
    }
    if (
      clientData.profile?.profile_plan &&
      clientData.profile.profile_end_date
    ) {
      const startDate = new Date(clientData.profile.profile_start_date!);
      const endDate = new Date(clientData.profile.profile_end_date!);
      const active = endDate.getTime() > Date.now();
      return {
        active,
        plan: clientData.profile.profile_plan,
        startDate,
        endDate,
      };
    }
    return { active: false, plan: "", startDate: null, endDate: null };
  })();

  // Funciones helper
  const getDaysRemaining = () => {
    if (!subscription.active || !subscription.endDate) return 0;
    const today = new Date();
    const diff = subscription.endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const weeklyGoal = 3;
  const getCurrentWeekProgress = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    return clientData.attendances.filter((att) => {
      const checkIn = new Date(att.checkInTime);
      return checkIn >= startOfWeek && checkIn < new Date();
    }).length;
  };

  const reloadClientData = async () => {
    try {
      const res = await fetch("/api/clients", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al recargar datos del cliente");
      setClientData(await res.json());
    } catch (error: any) {
      console.error("❌ Error al recargar datos:", error);
    }
  };

  const displayName = clientData.profile?.profile_first_name || clientData.name;
  const displayLastName =
    clientData.profile?.profile_last_name || clientData.lastName;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-24 h-24 border-2 border-yellow-400">
              <AvatarImage src={clientData.image || "/placeholder.svg"} />
              <AvatarFallback className="bg-yellow-400 text-black text-xl">
                {clientData.name?.charAt(0)}
                {clientData.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {displayName} {displayLastName}
              </h1>
              <p className="text-gray-400">
                {subscription.active ? "Miembro Activo" : "Sin suscripción"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center text-yellow-400 no-underline"
            >
              <Home className="h-6 w-6 mr-2" />
              Inicio
            </Link>
            <Button
              className="bg-yellow-400 text-black hover:bg-yellow-500"
              onClick={() => setProfileModalOpen(true)}
            >
              Editar perfil <Edit2 className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="text-black border-yellow-400"
              onClick={() => signOut()}
            >
              Cerrar sesión <LogOut className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ProfileModal */}
        {isProfileModalOpen && (
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            onSuccess={reloadClientData}
            userName={displayName}
            userLastName={displayLastName}
            userEmail={clientData.email}
            userPhone={clientData.profile?.profile_phone || ""}
            profileImage={clientData.image}
            userRole={clientData.role}
          />
        )}

        {/* Plan y Progreso */}
        <Card className="md:col-span-2 bg-white border-yellow-400">
          <CardHeader>
            <CardTitle className="text-yellow-400">Plan y Progreso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {subscription.active ? (
              <>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Crown className="text-yellow-400" />
                      {subscription.plan}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Válido hasta:{" "}
                      {subscription.endDate &&
                        subscription.endDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-2">
                    <Badge variant="outline" className="text-yellow-400">
                      {getDaysRemaining()} días restantes
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso semanal</span>
                    <span className="text-yellow-400">
                      {getCurrentWeekProgress()}/{weeklyGoal} sesiones
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {getCurrentWeekProgress() >= weeklyGoal ? (
                    <Badge
                      variant="outline"
                      className="flex items-center justify-center gap-2 py-2"
                    >
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      ¡Objetivo alcanzado!
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center justify-center gap-2 py-2"
                    >
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      Sigue esforzándote
                    </Badge>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-yellow-400">
                  No tienes una suscripción activa.
                </p>
                <Link
                  href="/#pricing"
                  className="inline-block bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
                >
                  ¡Adquiere un plan ahora!
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pestañas de funciones */}
        <Card className="md:col-span-3 bg-white border-yellow-400">
          <CardContent className="pt-6">
            <Tabs defaultValue="routines" className="w-full">
              <TabsList className="grid grid-cols-3 bg-white">
                <TabsTrigger
                  value="routines"
                  disabled={!subscription.active}
                  className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black disabled:opacity-50"
                >
                  Rutinas
                </TabsTrigger>
                <TabsTrigger
                  value="nutrition"
                  disabled={!subscription.active}
                  className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black disabled:opacity-50"
                >
                  Nutrición
                </TabsTrigger>
                <TabsTrigger
                  value="progress"
                  disabled={!subscription.active}
                  className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black disabled:opacity-50"
                >
                  Progreso
                </TabsTrigger>
              </TabsList>

              <TabsContent value="routines">
                {subscription.active ? (
                  <RoutineTab
                    gender={clientData.profile?.gender || "male"}
                    fitnessGoal={fitnessGoal}
                    bodyFocus={bodyFocus}
                    setFitnessGoal={setFitnessGoal}
                    setBodyFocus={setBodyFocus}
                  />
                ) : (
                  <p className="text-center text-red-500">
                    Debes tener un plan activo para acceder a las Rutinas.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="nutrition">
                {subscription.active ? (
                  <NutricionTab gender={clientData.profile?.gender || "male"} />
                ) : (
                  <p className="text-center text-red-500">
                    Debes tener un plan activo para acceder a Nutrición.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="progress">
                <div className="relative">
                  {/* Marca de agua */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-4xl text-gray-300 opacity-40">
                      En Construcción
                    </span>
                  </div>
                  {subscription.active ? (
                    <ProgressTab
                      attendances={clientData.attendances}
                      weeklyGoal={weeklyGoal}
                      measurements={{
                        weight: [],
                        arms: [],
                        waist: [],
                        hips: [],
                      }}
                    />
                  ) : (
                    <p className="text-center text-red-500">
                      Debes tener un plan activo para acceder a Progreso.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Productos Recomendados */}
        <Card className="md:col-span-2 bg-white border-yellow-400">
          <CardHeader>
            <CardTitle className="text-yellow-400">
              Productos Recomendados
            </CardTitle>
          </CardHeader>
          <section className="my-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {suggestedProducts.length > 0 ? (
                suggestedProducts.map((product: any) => (
                  <div
                    key={product.item_id}
                    className="bg-gray-900 text-white rounded-lg p-4 shadow-lg flex flex-col items-center border border-yellow-400 h-full"
                  >
                    <Image
                      src={product.item_image_url || "/placeholder.png"}
                      alt={product.item_name}
                      width={100}
                      height={100}
                      className="mb-4 rounded-lg object-cover w-full h-32"
                    />
                    <h4 className="font-bold text-lg text-center">
                      {product.item_name}
                    </h4>
                    <p className="text-sm text-gray-400 text-center">
                      {product.item_description}
                    </p>
                    <p className="text-yellow-400 font-bold mt-2">
                      S/. {product.item_price.toFixed(2)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 m-4 text-center">
                  No hay productos disponibles en este momento.
                </p>
              )}
            </div>
          </section>
        </Card>
      </div>
    </div>
  );
}

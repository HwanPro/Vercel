"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import ProfileModal from "@/ui/components/ProfileModal";
import { Home, Crown, Edit2, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";

// Importar componentes de Rutina y Nutrición
import RoutineTab from "@/ui/components/RoutineTab";
import NutricionTab from "@/ui/components/NutricionTab";

// Tipos de tu clientData
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
}
interface ClientProfile {
  profile_first_name: string | null;
  profile_last_name: string | null;
  profile_plan: string | null;
  profile_start_date: string | null;
  profile_end_date: string | null;
  profile_emergency_phone: string | null;
  profile_phone: string | null;
  gender?: "male" | "female";
}
interface ClientData {
  id: string;
  username: string; // user.username
  name: string; // user.firstName
  lastName: string; // user.lastName
  image: string | null;
  role: string;
  profile?: ClientProfile | null;
  memberships?: UserMembership[];
  attendances?: Attendance[];
}

export default function ClientDashboard() {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);

  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ejemplo: metas de fitness (test)
  const [fitnessGoal, setFitnessGoal] = useState<string>("strength");
  const [bodyFocus, setBodyFocus] = useState<string>("full");

  // Cargar datos del cliente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/me", { 
          credentials: "include",
          cache: "no-store"
        });
        const data = await res.json();
        console.log("👤 Cliente cargado:", data);
        if (!res.ok) {
          if (res.status === 401) {
            // Sesión expirada o no logueado
            router.push("/");
            return;
          }
          throw new Error("Error al obtener datos del cliente");
        }      
        setClientData(data);
      } catch (error) {
        console.error("❌ Error en la carga de datos:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Error al cargar datos"
        );
      }
    };
    
    fetchData();
    
    // Actualizar datos cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, [router]);

  // Manejamos estados de carga o error
  if (!clientData) return <p className="text-white">Cargando datos...</p>;
  if (errorMessage) return <p className="text-red-500">{errorMessage}</p>;

  // Lógica de suscripción
  const subscription = (() => {
    // membership con next-auth?
    if (clientData.memberships && clientData.memberships.length > 0) {
      const membership = clientData.memberships[0];
      const startDate = new Date(membership.assignedAt);
      const endDate = new Date(
        startDate.getTime() +
          membership.membership.membership_duration * 86400000
      );
      return {
        active: true,
        plan: membership.membership.membership_type,
        startDate,
        endDate,
      };
    }

    // O si tienes guardado en ClientProfile
    if (
      clientData.profile?.profile_plan &&
      clientData.profile?.profile_end_date
    ) {
      const sDate = new Date(clientData.profile.profile_start_date ?? "");
      const eDate = new Date(clientData.profile.profile_end_date ?? "");
      const active = eDate.getTime() > Date.now();
      return {
        active,
        plan: clientData.profile.profile_plan,
        startDate: sDate,
        endDate: eDate,
      };
    }

    return { active: false, plan: "", startDate: null, endDate: null };
  })();

  const getDaysRemaining = () => {
    if (!subscription.active || !subscription.endDate) return 0;
    const diff = subscription.endDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  // Progreso semanal
  const weeklyGoal = 3;
  const getCurrentWeekProgress = () => {
    if (!clientData.attendances) return 0;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // lunes
    return clientData.attendances.filter((att) => {
      const checkIn = new Date(att.checkInTime);
      return checkIn >= startOfWeek && checkIn < new Date();
    }).length;
  };

  // Para recargar una vez que guarde
  const reloadClientData = async () => {
    try {
      const res = await fetch("/api/user/me", {
        cache: "no-store"
      });
      if (!res.ok) throw new Error("Error al recargar datos del cliente");
      const newData = await res.json();
      setClientData(newData);
      console.log("✅ Datos del cliente recargados:", newData);
    } catch (error) {
      console.error("❌ Error al recargar datos:", error);
    }
  };

  // Nombres a mostrar
  const displayName = clientData.profile?.profile_first_name || clientData.name;
  const displayLastName =
    clientData.profile?.profile_last_name || clientData.lastName;

  return (
    <div className="p-6 bg-black min-h-screen text-white overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 border-2 border-yellow-400 rounded-full overflow-hidden bg-yellow-400 flex items-center justify-center">
              {clientData.image ? (
                <img 
                  src={clientData.image} 
                  alt="Imagen de perfil"
                  className="w-full h-full object-cover"
                  onLoad={() => console.log("🖼️ Avatar del dashboard cargado:", clientData.image)}
                  onError={() => console.log("❌ Error cargando avatar del dashboard:", clientData.image)}
                />
              ) : (
                <div className="bg-yellow-400 text-black text-xl font-bold">
                  {clientData.name?.charAt(0) || "U"}
                  {clientData.lastName?.charAt(0) || "N"}
                </div>
              )}
            </div>
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
            userName={clientData.username}
            firstName={
              clientData.profile?.profile_first_name || clientData.name
            }
            userLastName={clientData.lastName}
            userPhone={clientData.profile?.profile_phone || ""}
            userEmergencyPhone={
              clientData.profile?.profile_emergency_phone || ""
            }
            userRole={clientData.role}
            profileImage={clientData.image}
          />
        )}

        {/* Estado de Suscripción */}
        {subscription.active ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8" />
                  <div>
                    <h3 className="font-bold text-lg">{subscription.plan}</h3>
                    <p className="text-sm opacity-80">Plan Activo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{getDaysRemaining()}</div>
                  <p className="text-sm text-gray-600">Días restantes</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{getCurrentWeekProgress()}/{weeklyGoal}</div>
                  <p className="text-sm text-gray-600">Entrenamientos esta semana</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-bold text-red-600">Sin Suscripción Activa</h3>
                <p className="text-red-700">
                  Necesitas una suscripción activa para acceder a las funciones de entrenamiento.
                </p>
                <Link
                  href="/#pricing"
                  className="inline-block bg-yellow-400 text-black px-6 py-3 rounded-lg hover:bg-yellow-500 font-semibold"
                >
                  ¡Adquiere un plan ahora!
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contenido Principal */}
        {subscription.active ? (
          <Card className="bg-white shadow-lg">
            <CardContent className="p-0">
              <Tabs defaultValue="routines" className="w-full">
                <TabsList className="grid grid-cols-2 bg-gray-50 rounded-t-lg">
                  <TabsTrigger
                    value="routines"
                    className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black font-semibold"
                  >
                    🏋️‍♂️ Entrenamientos
                  </TabsTrigger>
                  <TabsTrigger
                    value="nutrition"
                    className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black font-semibold"
                  >
                    🥗 Nutrición
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="routines" className="mt-0">
                  <RoutineTab
                    gender={clientData.profile?.gender || "male"}
                    fitnessGoal={fitnessGoal}
                    bodyFocus={bodyFocus}
                    setFitnessGoal={setFitnessGoal}
                    setBodyFocus={setBodyFocus}
                  />
                </TabsContent>

                <TabsContent value="nutrition" className="mt-0 p-6">
                  <NutricionTab gender={clientData.profile?.gender || "male"} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Activa tu suscripción para acceder a todas las funciones de entrenamiento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

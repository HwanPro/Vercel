"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from "@/components/ui/card";
import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
import { Dumbbell, Users, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

export default function WolfGymLanding() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const router = useRouter(); // Hook para redirigir al usuario
  const { data: session, status } = useSession();

  const handleLogin = () => {
    router.push("/auth/login"); // Redirigir a la página de inicio de sesión
  };

  const handleProducts = () => {
    router.push("/products/public"); // Redirigir a la página de productos
  };

  // Obtener el email del usuario (implementa la lógica de autenticación si es necesario)
  const userEmail = session?.user?.email || "cliente@example.com"; // Reemplaza esto con el email real del usuario

  const handlePlanSelection = (plan: { amount: number; description: string }) => {
    if (status === "authenticated") {
      // Usuario autenticado, proceder con el pago (Aquí deberías implementar tu lógica de pago)
      alert(`Iniciar proceso de pago para el plan: ${plan.description}`);
      setModalAbierto(false);
    } else {
      // Usuario no autenticado, redirigir a inicio de sesión
      signIn(); // Esto abrirá la página de inicio de sesión de next-auth
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-white">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-black">
        <Link className="flex items-center justify-center" href="/">
          <Image
            src="/uploads/images/logo.jpg"
            alt="Wolf Gym Logo"
            width={100}
            height={50}
            style={{ width: "auto", height: "auto" }}
          />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button
            onClick={handleLogin}
            className="text-sm font-medium hover:text-yellow-400 underline-offset-4"
          >
            Inicia sesión
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-yellow-400">
                  Bienvenido a Wolf Gym
                </h1>
                <p className="mx-auto max-w-[700px] text-white md:text-xl">
                  Libera tu lobo interior. Únete a la manada y transforma tu cuerpo y mente.
                </p>
              </div>
              <div className="space-x-4">
                <Button
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={() => setModalAbierto(true)}
                >
                  Comenzar
                </Button>
                <Button
                  variant="outline"
                  className="text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black"
                  onClick={handleProducts}
                >
                  Ver Productos
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white text-black">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12 text-black">
              Nuestras Características
            </h2>
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
              <Card className="bg-black text-white">
                <CardHeader>
                  <Dumbbell className="w-12 h-12 mb-4 text-yellow-400" />
                  <CardTitle className="text-yellow-400">Equipos de Última Tecnología</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Acceso a equipamiento de fitness.</p>
                </CardContent>
              </Card>
              <Card className="bg-black text-white">
                <CardHeader>
                  <Users className="w-12 h-12 mb-4 text-yellow-400" />
                  <CardTitle className="text-yellow-400">Entrenadores Expertos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Guía personalizada por profesionales certificados.</p>
                </CardContent>
              </Card>
              <Card className="bg-black text-white">
                <CardHeader>
                  <Calendar className="w-12 h-12 mb-4 text-yellow-400" />
                  <CardTitle className="text-yellow-400">Clases Diversas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Próximamente...</p>
                </CardContent>
              </Card>
              <Card className="bg-black text-white">
                <CardHeader>
                  <Clock className="w-12 h-12 mb-4 text-yellow-400" />
                  <CardTitle className="text-yellow-400">Horarios de Apertura</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white text-sm">
                    <strong>De lunes a viernes:</strong> 6 AM - 9 PM
                  </p>
                  <p className="text-white text-sm">
                    <strong>Sábados:</strong> 6 AM - 8 PM
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="pricing" className="w-full py-10 md:py-20 lg:py-28 bg-black">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12 text-yellow-400">
              Planes de Membresía
            </h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-white text-black flex flex-col">
                <CardHeader>
                  <CardTitle className="text-yellow-400 text-xl">Plan Mensual</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-4xl font-bold mb-4 text-black">S/60.00/Mes</div>
                </CardContent>
                <Button className="w-full mt-auto bg-yellow-400 text-black hover:bg-yellow-500">
                  Elegir Plan
                </Button>
              </Card>
              <Card className="bg-white text-black flex flex-col">
                <CardHeader>
                  <CardTitle className="text-yellow-400 text-xl">Básico</CardTitle>
                  <CardDescription className="text-gray-600">
                    Para personas que van al gimnasio de forma casual
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-4xl font-bold mb-4 text-black">S/150.00/Mes</div>
                </CardContent>
                <Button className="w-full mt-auto bg-yellow-400 text-black hover:bg-yellow-500">
                  Elegir Plan
                </Button>
              </Card>
              <Card className="bg-white text-black flex flex-col">
                <CardHeader>
                  <CardTitle className="text-yellow-400 text-xl">Pro</CardTitle>
                  <CardDescription className="text-gray-600">
                    Para entusiastas dedicados al fitness
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-4xl font-bold mb-4 text-black">S/100.00/Mes</div>
                </CardContent>
                <Button className="w-full mt-auto bg-yellow-400 text-black hover:bg-yellow-500">
                  Elegir Plan
                </Button>
              </Card>
              <Card className="bg-white text-black flex flex-col">
                <CardHeader>
                  <CardTitle className="text-yellow-400 text-xl">Elite</CardTitle>
                  <CardDescription className="text-gray-600">
                    Para aquellos que buscan resultados máximos
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-4xl font-bold mb-4 text-black">S/350.00/Año</div>
                </CardContent>
                <Button className="w-full mt-auto bg-yellow-400 text-black hover:bg-yellow-500">
                  Elegir Plan
                </Button>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-8 w-full shrink-0 items-center px-4 md:px-6 border-t border-yellow-400">
        <p className="text-xs text-black">© 2024 Wolf Gym. Todos los derechos reservados.</p>
        <nav className="sm:ml-auto flex mx-auto sm:gap-6">
          <Link
            className="text-xs hover:text-yellow-400 underline-offset-4 text-black"
            href="#"
          >
            Términos del Servicio
          </Link>
          <Link
            className="text-xs hover:text-yellow-400 underline-offset-4 text-black"
            href="#"
          >
            Privacidad
          </Link>
        </nav>
      </footer>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="bg-white text-black rounded-lg p-8 shadow-lg max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">Elige tu plan de suscripción</DialogTitle>
            <DialogDescription className="text-gray-500 mb-6">
              Selecciona el plan que mejor se adapte a tus necesidades de entrenamiento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6">
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black text-sm py-2 px-4 rounded"
              onClick={() => handlePlanSelection({ amount: 6000, description: "Plan Mensual - S/60.00/mes" })}
            >
              Plan Mensual - S/60.00/mes
            </Button>
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black text-sm py-2 px-4 rounded"
              onClick={() => handlePlanSelection({ amount: 15000, description: "Plan Básico - S/150.00/mes" })}
            >
              Plan Básico - S/150.00/mes
            </Button>
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black text-sm py-2 px-4 rounded"
              onClick={() => handlePlanSelection({ amount: 10000, description: "Plan Pro - S/100.00/mes" })}
            >
              Plan Pro - S/100.00/mes
            </Button>
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black text-sm py-2 px-4 rounded"
              onClick={() => handlePlanSelection({ amount: 35000, description: "Plan Elite - S/350.00/Año" })}
            >
              Plan Elite - S/350.00/Año
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

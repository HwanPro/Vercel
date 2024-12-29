"use client";

import { Button } from "@/components/ui/button";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from "@/components/ui/card";
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
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

type PlanInfo = {
  amount: number;       // Monto en céntimos (S/60.00 => 6000)
  description: string;  // Ej: "Plan Mensual - S/60.00"
};

export default function WolfGymLanding() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();

  // Botón menú mobile
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  // Abrir modal de planes
  const handleOpenModal = () => {
    setModalAbierto(true);
  };

  // Ir a login
  const handleLogin = () => {
    router.push("/auth/login");
  };

  // Ir a productos
  const handleProducts = () => {
    router.push("/products/public");
  };

  /**
   * Lógica principal para elegir/comprar un plan:
   * 1. Verifica si el usuario está logueado.
   * 2. Si NO, llama a signIn().
   * 3. Si SÍ, abre Culqi.
   */
  const handlePlanSelection = async (plan: PlanInfo) => {
    if (!session) {
      // Forzar login/registro
      signIn();
      return;
    }

    // Aquí ya hay sesión => abrir Culqi
    if (!window.Culqi) {
      alert("Culqi aún no está disponible. Revisa la carga del script.");
      return;
    }

    // Configurar Culqi
    window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY!;
    window.Culqi.settings({
      title: "Wolf Gym",
      currency: "PEN",
      description: plan.description,
      amount: plan.amount, // en céntimos
    });

    // Definir qué pasa cuando Culqi nos da el token
    window.Culqi.token = async (tokenObject: any) => {
      console.log("Token de Culqi:", tokenObject);

      try {
        const resp = await fetch("/api/payaments/culqui", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenObject.id,
            amount: plan.amount,
            description: plan.description,
            email: session?.user?.email || "cliente@example.com",
          }),
        });

        if (!resp.ok) {
          throw new Error("Error al procesar el pago");
        }

        const data = await resp.json();
        console.log("Pago realizado con éxito:", data);
        alert("¡Pago exitoso! Se te ha asignado el plan.");
      } catch (error) {
        console.error("Error al procesar el pago:", error);
        alert("Hubo un problema procesando el pago.");
      }
      // Cerrar el modal de planes (si quieres)
      setModalAbierto(false);
    };

    // Finalmente abrimos el checkout de Culqi
    window.Culqi.open();
  };

  // Efecto para mostrar los botones fijos (al hacer scroll)
  useEffect(() => {
    function onScroll() {
      setShowSticky(window.scrollY > 800);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * StickyButtons: Se muestra en la parte superior cuando
   * el usuario scrollea más de 800px
   */
  function StickyButtons() {
    if (!showSticky) return null;

    return (
      <div className="fixed top-0 left-0 right-0 bg-white p-4 flex justify-end gap-4 container mx-auto px-4 z-50">
        <Button
          className="bg-yellow-400 text-black hover:bg-yellow-500"
          onClick={handleOpenModal}
        >
          Comenzar
        </Button>
        <Button
          variant="outline"
          className="text-yellow-600 border-yellow-400 hover:bg-yellow-400 hover:text-black"
          onClick={handleProducts}
        >
          Ver Productos
        </Button>

        {/* Menú mobile */}
        <nav className="ml-auto flex items-center gap-4">
          <button
            className="lg:hidden block text-yellow-400"
            onClick={handleMobileMenuToggle}
          >
            ☰
          </button>

          {/* Panel que se muestra/oculta */}
          <div
            className={`${
              mobileMenuOpen ? "block" : "hidden"
            } lg:flex gap-4 bg-black text-white p-4 lg:p-0`}
          >
            {session ? (
              // Si hay sesión, mostramos el rol
              <Button
                onClick={() =>
                  session.user.role === "admin"
                    ? router.push("/admin/dashboard")
                    : router.push("/client/dashboard")
                }
                className="text-sm font-medium bg-yellow-400 text-black hover:bg-yellow-500"
              >
                {session.user.role === "admin"
                  ? "Ir al Panel Admin"
                  : "Ir a Mi Perfil"}
              </Button>
            ) : (
              // Si no hay sesión
              <Button
                onClick={handleLogin}
                className="text-sm font-medium hover:text-yellow-400 underline-offset-4"
              >
                Inicia sesión
              </Button>
            )}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white">
      {/* Botones sticky que aparecen al scrollear */}
      <StickyButtons />

      {/* Encabezado con logo */}
      <header className="flex flex-col items-center justify-center py-12">
        <Image
          src="/uploads/images/logo2.jpg"
          alt="Wolf Gym Logo"
          width={400}
          height={400}
          priority
        />
      </header>

      {/* Sección principal (Hero) */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-yellow-400">
                  Bienvenido a Wolf Gym
                </h1>
                <p className="mx-auto max-w-[700px] text-white md:text-xl">
                  Libera tu lobo interior. Únete a la manada y transforma tu
                  cuerpo y mente.
                </p>
              </div>
              {/* AQUÍ eliminamos los botones del Hero */}
              {/* <div className="space-x-4">
                <Button
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={() => alert("Empezar proceso (ejemplo)")}
                >
                  Comenzar
                </Button>
                <Button
                  variant="outline"
                  className="text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black"
                  onClick={() => router.push("/products/public")}
                >
                  Ver Productos
                </Button>
              </div> */}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-white text-black"
        >
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12 text-black">
              Nuestras Características
            </h2>
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
              <Card className="bg-black text-white">
                <CardHeader>
                  <Dumbbell className="w-12 h-12 mb-4 text-yellow-400" />
                  <CardTitle className="text-yellow-400">
                    Equipos de Última Tecnología
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Acceso a equipamiento de fitness.</p>
                </CardContent>
              </Card>
              <Card className="bg-black text-white">
                <CardHeader>
                  <Users className="w-12 h-12 mb-4 text-yellow-400" />
                  <CardTitle className="text-yellow-400">
                    Entrenadores Expertos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Guía personalizada por profesionales certificados.</p>
                </CardContent>
              </Card>
              <Card className="bg-black text-white">
                <CardHeader>
                  <Calendar className="w-12 h-12 mb-4 text-yellow-400" />
                  <CardTitle className="text-yellow-400">
                    Clases Diversas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Próximamente...</p>
                </CardContent>
              </Card>
              <Card className="bg-black text-white">
                <CardHeader>
                  <Clock className="w-12 h-12 mb-4 text-yellow-400" />
                  <CardTitle className="text-yellow-400">
                    Horarios de Apertura
                  </CardTitle>
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

        {/* Sección de Planes de Membresía */}
        <section id="pricing" className="py-10 md:py-20 lg:py-28 bg-black">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-5xl text-yellow-400 font-bold text-center mb-12">
              Planes de Membresía
            </h2>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {/* Plan Mensual */}
              <div className="bg-white text-black flex flex-col items-center p-6 rounded-lg shadow-md">
                <h3 className="text-yellow-400 text-2xl mb-2">Plan Mensual</h3>
                <div className="flex-grow flex flex-col items-center">
                  <div className="text-4xl font-bold mb-4 text-black">
                    S/60.00
                  </div>
                  <p className="text-gray-600 mb-4">Por mes</p>
                  <ul className="text-sm text-gray-600 mb-6 space-y-2">
                    <li>Acceso ilimitado al gimnasio</li>
                    <li>Uso de todas las máquinas</li>
                  </ul>
                </div>
                <Button
                  className="w-full mt-auto bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={() =>
                    handlePlanSelection({
                      amount: 6000, // S/60 => 6000 céntimos
                      description: "Plan Mensual - S/60.00",
                    })
                  }
                >
                  Elegir Plan
                </Button>
              </div>

              {/* Plan Básico */}
              <div className="bg-white text-black flex flex-col items-center p-6 rounded-lg shadow-md">
                <h3 className="text-yellow-400 text-2xl mb-2">Básico</h3>
                <div className="flex-grow flex flex-col items-center">
                  <div className="text-4xl font-bold mb-4">S/100.00</div>
                  <p className="text-gray-600 mb-4">Pareja al mes</p>
                  <ul className="text-sm text-gray-600 mb-6 space-y-2">
                    <li>Acceso ilimitado al gimnasio</li>
                    <li>Descuento en productos</li>
                  </ul>
                </div>
                <Button
                  className="w-full mt-auto bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={() =>
                    handlePlanSelection({
                      amount: 10000, // S/100 => 10000 céntimos
                      description: "Plan Básico - S/100.00",
                    })
                  }
                >
                  Elegir Plan
                </Button>
              </div>

              {/* Plan Pro */}
              <div className="bg-white text-black flex flex-col items-center p-6 rounded-lg shadow-md">
                <h3 className="text-yellow-400 text-2xl mb-2">Pro</h3>
                <div className="flex-grow flex flex-col items-center">
                  <div className="text-4xl font-bold mb-4">S/150.00</div>
                  <p className="text-gray-600 mb-4">Por 3 meses</p>
                  <ul className="text-sm text-gray-600 mb-6 space-y-2">
                    <li>Acceso ilimitado al gimnasio</li>
                    <li>Entrenamiento personalizado</li>
                  </ul>
                </div>
                <Button
                  className="w-full mt-auto bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={() =>
                    handlePlanSelection({
                      amount: 15000, // S/150 => 15000 céntimos
                      description: "Plan Pro - S/150.00",
                    })
                  }
                >
                  Elegir Plan
                </Button>
              </div>

              {/* Plan Elite */}
              <div className="bg-white text-black flex flex-col items-center p-6 rounded-lg shadow-md">
                <h3 className="text-yellow-400 text-2xl mb-2">Elite</h3>
                <div className="flex-grow flex flex-col items-center">
                  <div className="text-4xl font-bold mb-4">S/350.00</div>
                  <p className="text-gray-600 mb-4">Por año</p>
                  <ul className="text-sm text-gray-600 mb-6 space-y-2">
                    <li>Acceso ilimitado al gimnasio</li>
                    <li>Entrenamiento personalizado</li>
                  </ul>
                </div>
                <Button
                  className="w-full mt-auto bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={() =>
                    handlePlanSelection({
                      amount: 35000, // S/350 => 35000 céntimos
                      description: "Plan Elite - S/350.00",
                    })
                  }
                >
                  Elegir Plan
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section
          id="gallery"
          className="w-full py-12 md:py-24 lg:py-32 bg-white container mx-auto"
        >
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12 text-black">
              Galería de Fotos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mx-auto">
              {/* Aquí puedes agregar las imágenes del gimnasio */}
              <Image
                src="/uploads/images/logo.jpg"
                alt="Gym Photo 1"
                width={400}
                height={300}
                className="rounded-lg"
              />
              <Image
                src="/uploads/images/logo.jpg"
                alt="Gym Photo 2"
                width={400}
                height={300}
                className="rounded-lg"
              />
              <Image
                src="/uploads/images/logo.jpg"
                alt="Gym Photo 3"
                width={400}
                height={300}
                className="rounded-lg"
              />
              {/* Agrega más imágenes según sea necesario */}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black text-white py-8">
        <div className="container mx-auto px-4">
          {/* 
          Usamos 'flex' + 'flex-wrap' y en desktop 'justify-between'. 
          En mobile/tablet podemos centrar todo con 'justify-center'. 
        */}
          <div className="flex flex-wrap items-center justify-center md:justify-between">
            {/* Sección izquierda */}
            <div className="w-full md:w-1/3 mb-6 md:mb-0 text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">Wolf Gym</h3>
              <p className="text-sm">
                Transformando vidas, un entrenamiento a la vez.
              </p>
            </div>

            {/* Sección central (redes sociales) */}
            <div className="flex space-x-6 mb-4 md:mb-0">
              {/* Ajusta el tamaño de iconos con text-2xl, text-3xl, etc. */}
              <a href="#" className="text-white hover:text-yellow-400 text-2xl">
                <FaFacebook />
              </a>
              <a href="#" className="text-white hover:text-yellow-400 text-2xl">
                <FaInstagram />
              </a>
              <a href="#" className="text-white hover:text-yellow-400 text-2xl">
                <FaTwitter />
              </a>
            </div>

            {/* Sección derecha */}
            <div className="w-full md:w-1/3 text-center md:text-right">
              <h4 className="text-lg font-semibold mb-2">Ubícanos</h4>
              <p className="text-sm mb-2">Av. Peru 622, Ica 11003</p>
              <a
                href="https://maps.app.goo.gl/jnQge8XcuerTmnZRA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:underline"
              >
                Ver en Google Maps
              </a>
            </div>
          </div>

          {/* Línea y copyright */}
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p className="text-sm">
              © 2024 Wolf Gym. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="bg-white text-black rounded-lg p-8 shadow-lg max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">
              Elige tu plan de suscripción
            </DialogTitle>
            <DialogDescription className="text-gray-500 mb-6">
              Selecciona el plan que mejor se adapte a tus necesidades de
              entrenamiento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6">
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black text-sm py-2 px-4 rounded"
              onClick={() =>
                handlePlanSelection({
                  amount: 6000,
                  description: "Plan Mensual - S/60.00",
                })
              }
            >
              Plan Mensual - S/60.00
            </Button>

            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black text-sm py-2 px-4 rounded"
              onClick={() =>
                handlePlanSelection({
                  amount: 15000,
                  description: "Plan Básico - S/150.00",
                })
              }
            >
              Plan Básico - S/150.00
            </Button>

            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black text-sm py-2 px-4 rounded"
              onClick={() =>
                handlePlanSelection({
                  amount: 10000,
                  description: "Plan Pro - S/100.00",
                })
              }
            >
              Plan Pro - S/100.00
            </Button>

            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black text-sm py-2 px-4 rounded"
              onClick={() =>
                handlePlanSelection({
                  amount: 35000,
                  description: "Plan Elite - S/350.00",
                })
              }
            >
              Plan Elite - S/350.00
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

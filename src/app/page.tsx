"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession, signIn } from "next-auth/react";
import StoriesCarousel from "@/ui/components/StoriesCarousel";
import { Button } from "@/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/ui/card";
import { Dumbbell, Users, Calendar, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog";

// ------------------------
// COMPONENTE AUXILIAR: EditPlanForm
// ------------------------
type Plan = {
  id: string;
  name: string;
  price: number;
  description: string;
  amountCents: number;
};

interface EditPlanFormProps {
  plan: Plan;
  onClose: () => void;
  onSaveSuccess: () => void;
}

function EditPlanForm({ plan, onClose, onSaveSuccess }: EditPlanFormProps) {
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(plan.price);
  const [description, setDescription] = useState(plan.description);

  const handleSave = async () => {
    try {
      const resp = await fetch(`/api/plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, description }),
      });
      if (!resp.ok) {
        throw new Error("Error al actualizar el plan");
      }
      toast.success("Plan actualizado con éxito");
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el plan");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold mb-1">Nombre</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-bold mb-1">Precio</label>
        <input
          type="number"
          className="w-full p-2 border rounded"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      </div>
      <div>
        <label className="block text-sm font-bold mb-1">Descripción</label>
        <textarea
          className="w-full p-2 border rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button onClick={handleSave}>Guardar</Button>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ------------------------
// COMPONENTE AUXILIAR: EditGalleryForm
// ------------------------
type GalleryItem = {
  id: string;
  imageUrl: string;
};

interface EditGalleryFormProps {
  item: GalleryItem;
  onClose: () => void;
  onSaveSuccess: () => void;
}

function EditGalleryForm({
  item,
  onClose,
  onSaveSuccess,
}: EditGalleryFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const resp = await fetch(`/api/gallery/${item.id}`, {
        method: "PUT", // asumiendo que PUT actualiza la imagen
        body: formData,
      });
      if (!resp.ok) throw new Error("Error al actualizar la imagen");
      toast.success("Imagen actualizada con éxito");
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar la imagen");
    }
  };

  const handleDelete = async () => {
    try {
      const resp = await fetch(`/api/gallery/${item.id}`, {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error("Error al eliminar la imagen");
      toast.success("Imagen eliminada");
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar la imagen");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Image
          src={item.imageUrl}
          alt="Galería"
          width={300}
          height={200}
          className="rounded"
        />
      </div>
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full"
        />
      </div>
      <div className="flex justify-between">
        <Button onClick={handleUpload}>Actualizar Imagen</Button>
        <Button variant="destructive" onClick={handleDelete}>
          Borrar Imagen
        </Button>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ------------------------
// COMPONENTE PRINCIPAL: WolfGymLanding
// ------------------------
export default function WolfGymLanding() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  // Estados para editar planes y galería (admin)
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [modalPlan, setModalPlan] = useState<Plan | null>(null);
  const [showEditGalleryModal, setShowEditGalleryModal] = useState(false);
  const [modalGalleryItem, setModalGalleryItem] = useState<GalleryItem | null>(
    null
  );
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "admin";
  const [membershipPlans, setMembershipPlans] = useState<Plan[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        const data = await res.json();
        setMembershipPlans(data); // <-- guardas en el estado
      } catch (err) {
        console.error("Error al cargar planes:", err);
      }
    };
    fetchPlans();
  }, []);
  // Función para abrir el modal de edición de un plan (admin)
  function openEditPlanModal(plan: Plan) {
    setModalPlan(plan);
    setShowEditPlanModal(true);
    console.log("Editar plan:", plan);
  }

  // Función para abrir el modal de edición de un item de galería (admin)
  function openEditGalleryModal(item: GalleryItem) {
    setModalGalleryItem(item);
    setShowEditGalleryModal(true);
    console.log("Editar item de galería:", item);
  }

  // Manejo de planes vía Culqi (para clientes)
  const handlePlanSelection = async (planInfo: {
    amount: number;
    description: string;
  }) => {
    if (!session) {
      signIn();
      return;
    }
    if (!window.Culqi) {
      alert("Culqi aún no está disponible. Revisa la carga del script.");
      return;
    }
    window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY!;
    window.Culqi.settings({
      title: "Wolf Gym",
      currency: "PEN",
      description: planInfo.description,
      amount: planInfo.amount,
    });
    window.Culqi.token = async (tokenObject: { id: string }) => {
      console.log("Token de Culqi:", tokenObject);
      try {
        const resp = await fetch("/api/payaments/culqui", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenObject.id,
            amount: planInfo.amount,
            description: planInfo.description,
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
      setModalAbierto(false);
    };
    window.Culqi.open();
  };

  // Efecto: botones sticky
  useEffect(() => {
    function onScroll() {
      setShowSticky(window.scrollY > 800);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cargar script de Culqi
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.culqi.com/js/v4";
    script.async = true;
    script.onload = () => {
      console.log("✅ Culqi script cargado correctamente");
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Cargar la galería (se asume endpoint /api/gallery retorna [{ id, imageUrl }])
  const fetchGalleryItems = async () => {
    try {
      const res = await fetch("/api/gallery");
      if (!res.ok) throw new Error("Error al cargar galería");
      const data = await res.json();
      setGalleryItems(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la galería.");
    }
  };

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  // Botón sticky
  function StickyButtons() {
    if (!showSticky) return null;
    return (
      <div className="fixed top-0 left-0 right-0 bg-black p-3 flex items-center justify-between container mx-auto z-50">
        <h1 className="text-yellow-400 text-base font-bold">Wolf Gym</h1>
        <div className="flex gap-3">
          <Button
            className="bg-yellow-400 text-black hover:bg-yellow-500 text-xs px-3 py-1"
            onClick={() => setModalAbierto(true)}
          >
            Comenzar
          </Button>
          <Button
            variant="outline"
            className="text-yellow-400 border-yellow-400 bg-black hover:bg-yellow-400 hover:text-black text-xs px-3 py-1"
            onClick={handleProducts}
          >
            Ver Productos
          </Button>
          {session ? (
            <Button
              onClick={() =>
                session.user.role === "admin"
                  ? router.push("/admin/dashboard")
                  : router.push("/client/dashboard")
              }
              className="bg-yellow-400 text-black hover:bg-yellow-500 text-xs px-3 py-1"
            >
              {session.user.role === "admin" ? "Panel Admin" : "Mi Perfil"}
            </Button>
          ) : (
            <Button
              onClick={handleLogin}
              className="border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black text-xs px-3 py-1"
            >
              Inicia sesión
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Funciones de navegación
  const handleLogin = () => {
    router.push("/auth/login");
  };
  const handleProducts = () => {
    router.push("/products/public");
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <StickyButtons />
      <header className="flex flex-col items-center justify-center py-6">
        <Image
          src="/uploads/images/logo2.jpg"
          alt="Wolf Gym Logo"
          width={500}
          height={500}
          priority
        />
      </header>

      {showEditPlanModal && modalPlan && (
        <Dialog
          open={showEditPlanModal}
          onOpenChange={(open) => {
            setShowEditPlanModal(open);
            if (!open) setModalPlan(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Plan</DialogTitle>
            </DialogHeader>
            <EditPlanForm
              plan={modalPlan}
              onClose={() => setShowEditPlanModal(false)}
              onSaveSuccess={() => {
                // O recargar la lista
                // fetchPlanes() o algo similar
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {showEditGalleryModal && modalGalleryItem && (
        <Dialog
          open={showEditGalleryModal}
          onOpenChange={(open) => {
            setShowEditGalleryModal(open);
            if (!open) setModalGalleryItem(null);
          }}
        >
          <DialogContent className="bg-white text-black rounded-lg p-8 shadow-lg max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold mb-2">
                Editar Imagen de Galería
              </DialogTitle>
              <DialogDescription className="text-gray-500 mb-6">
                Actualiza o borra esta imagen.
              </DialogDescription>
            </DialogHeader>
            <EditGalleryForm
              item={modalGalleryItem}
              onClose={() => setShowEditGalleryModal(false)}
              onSaveSuccess={fetchGalleryItems}
            />
          </DialogContent>
        </Dialog>
      )}

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
                <p className="mx-auto max-w-[700px] text-white md:text-xl">
                  Prohibido Rendirse
                </p>
              </div>
            </div>
          </div>
        </section>

        <StoriesCarousel />

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

        <section id="pricing" className="py-10 md:py-20 lg:py-28 bg-black">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-5xl text-yellow-400 font-bold text-center mb-12">
              Planes de Membresía
            </h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {membershipPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white text-black flex flex-col items-center p-6 rounded-lg shadow-md"
                >
                  <h3 className="text-yellow-400 text-2xl mb-2">{plan.name}</h3>
                  <div className="flex-grow flex flex-col items-center">
                    <div className="text-4xl font-bold mb-4 text-black">
                      S/ {plan.price.toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                      {plan.description}
                    </p>
                  </div>
                  {isAdmin ? (
                    <Button
                      onClick={() => openEditPlanModal(plan)}
                      className="bg-yellow-400 text-black hover:bg-yellow-500"
                    >
                      Editar Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() =>
                        handlePlanSelection({
                          amount: plan.amountCents,
                          description: `${plan.name} - S/${plan.price.toFixed(2)}`,
                        })
                      }
                      className="bg-yellow-400 text-black hover:bg-yellow-500"
                    >
                      Elegir Plan
                    </Button>
                  )}
                </div>
              ))}
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

            {isAdmin && (
              <div className="mb-6 flex justify-center">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const fileInput = form.elements.namedItem(
                      "file"
                    ) as HTMLInputElement;
                    if (!fileInput?.files?.[0]) return;

                    const formData = new FormData();
                    formData.append("file", fileInput.files[0]);

                    try {
                      const res = await fetch("/api/gallery", {
                        method: "POST",
                        body: formData,
                      });
                      if (!res.ok) throw new Error("Error al subir la imagen");
                      toast.success("Imagen subida con éxito");
                      fetchGalleryItems(); // recarga
                      form.reset();
                    } catch (err) {
                      console.error(err);
                      toast.error("Error al subir imagen");
                    }
                  }}
                  className="flex items-center gap-4"
                >
                  <input
                    type="file"
                    name="file"
                    accept="image/*"
                    className="border rounded p-2"
                    required
                  />
                  <Button
                    type="submit"
                    className="bg-yellow-400 text-black hover:bg-yellow-500"
                  >
                    Subir Imagen
                  </Button>
                </form>
              </div>
            )}

            {/* AQUÍ RENDERIZAS TUS IMÁGENES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mx-auto mt-6">
              {galleryItems.map((item) => (
                <div key={item.id} className="relative group">
                  <Image
                    src={item.imageUrl}
                    alt="Imagen de galería"
                    width={400}
                    height={300}
                    className="rounded-lg"
                  />
                  {isAdmin && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50">
                      <Button
                        onClick={() => openEditGalleryModal(item)}
                        className="bg-yellow-400 text-black hover:bg-yellow-500 text-xs px-3 py-1"
                      >
                        Editar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center md:justify-between">
            <div className="w-full md:w-1/3 mb-6 md:mb-0 text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">Wolf Gym</h3>
              <p className="text-sm">
                Transformando vidas, un entrenamiento a la vez.
              </p>
            </div>
            <div className="flex space-x-6 mb-4 md:mb-0">
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
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-yellow-400 mx-auto">
              PROHIBIDO RENDIRSE
            </h1>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p className="text-sm">
              © 2024 Wolf Gym. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Modal de Planes */}
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

      <ToastContainer />
    </div>
  );
}

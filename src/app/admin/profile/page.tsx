"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, UserRound } from "lucide-react";
import ProfileModal from "@/ui/components/ProfileModal";
import { Button } from "@/ui/button";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type AdminMe = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  image?: string | null;
  role: string;
  profile?: {
    profile_emergency_phone?: string | null;
  } | null;
};

export default function AdminProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isRedirecting = useRef(false);
  const [adminMe, setAdminMe] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const redirectToLogin = () => {
    if (isRedirecting.current) return;
    isRedirecting.current = true;
    router.replace("/auth/login");
  };

  const loadAdminProfile = async () => {
    try {
      const response = await fetch("/api/admin/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        throw new Error("No se pudo obtener el perfil de admin");
      }

      const data: AdminMe = await response.json();
      setAdminMe(data);
    } catch (error) {
      console.error("Error cargando perfil admin:", error);
      toast.error("No se pudo cargar el perfil de administrador.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminProfile();
  }, []);

  return (
    <div className="min-h-screen bg-black px-6 text-white">
      <ToastContainer position="top-right" autoClose={3000} />

      <header className="relative flex h-14 items-center bg-black px-4 lg:px-6">
        <Link className="flex items-center justify-center no-underline" href="/">
          <Home className="mr-2 h-6 w-6 text-yellow-400" />
          <span className="text-yellow-400">Inicio</span>
        </Link>
        <nav className="ml-auto flex gap-3 sm:gap-4">
          <Link
            href="/admin/dashboard"
            className="rounded border border-yellow-400 px-4 py-2 text-center text-yellow-400 hover:bg-yellow-400 hover:text-black"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/reportes"
            className="rounded bg-yellow-400 px-4 py-2 text-center text-black hover:bg-yellow-500"
          >
            Reportes
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl py-8">
        <h1 className="mb-6 text-center text-3xl font-bold text-yellow-400">
          Perfil de Administrador
        </h1>

        {loading && (
          <div className="rounded border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
            Cargando perfil...
          </div>
        )}

        {!loading && adminMe && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-yellow-400 bg-zinc-900">
                <UserRound className="h-8 w-8 text-yellow-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-yellow-400">
                  {adminMe.firstName} {adminMe.lastName}
                </p>
                <p className="text-sm text-zinc-400">Rol: {adminMe.role}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded border border-zinc-800 bg-black p-3">
                <dt className="text-xs uppercase tracking-wide text-zinc-400">
                  Usuario
                </dt>
                <dd className="mt-1 text-sm">{adminMe.username}</dd>
              </div>
              <div className="rounded border border-zinc-800 bg-black p-3">
                <dt className="text-xs uppercase tracking-wide text-zinc-400">
                  Teléfono
                </dt>
                <dd className="mt-1 text-sm">{adminMe.phoneNumber || "No definido"}</dd>
              </div>
              <div className="rounded border border-zinc-800 bg-black p-3 sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-zinc-400">
                  Emergencia
                </dt>
                <dd className="mt-1 text-sm">
                  {adminMe.profile?.profile_emergency_phone || "No definido"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                className="bg-yellow-400 text-black hover:bg-yellow-500"
                onClick={() => setShowProfileModal(true)}
              >
                Editar Perfil
              </Button>
            </div>
          </section>
        )}
      </main>

      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSuccess={async () => {
            await loadAdminProfile();
          }}
          userName={adminMe?.username ?? session?.user?.name ?? ""}
          firstName={adminMe?.firstName ?? session?.user?.firstName ?? ""}
          userLastName={adminMe?.lastName ?? session?.user?.lastName ?? ""}
          userPhone={adminMe?.phoneNumber ?? session?.user?.phoneNumber ?? ""}
          userEmergencyPhone={adminMe?.profile?.profile_emergency_phone ?? ""}
          userRole={adminMe?.role ?? session?.user?.role ?? "admin"}
          profileImage={adminMe?.image ?? session?.user?.image ?? ""}
        />
      )}
    </div>
  );
}

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
    documentNumber?: string | null;
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
    <div className="min-h-screen bg-wolf-page px-4 text-wolf-ink sm:px-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <header className="relative flex h-14 items-center border-b border-wolf-border bg-white px-4 lg:px-6">
        <Link className="flex items-center justify-center no-underline" href="/">
          <Home className="mr-2 h-6 w-6 text-wolf-primary-strong" />
          <span className="font-semibold text-wolf-ink">Inicio</span>
        </Link>
        <nav className="ml-auto flex gap-3 sm:gap-4">
          <Link
            href="/admin/dashboard"
            className="rounded border border-wolf-border px-4 py-2 text-center text-wolf-ink hover:bg-wolf-muted"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/reportes"
            className="rounded bg-wolf-primary px-4 py-2 text-center font-semibold text-wolf-ink hover:bg-yellow-300"
          >
            Reportes
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl py-8">
        <h1 className="mb-6 text-center text-3xl font-black text-wolf-ink">
          Perfil de administrador
        </h1>

        {loading && (
          <div className="rounded border border-wolf-border bg-white p-6 text-wolf-subtle shadow-sm">
            Cargando perfil...
          </div>
        )}

        {!loading && adminMe && (
          <section className="rounded-xl border border-wolf-border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-wolf-primary bg-wolf-muted">
                <UserRound className="h-8 w-8 text-wolf-primary-strong" />
              </div>
              <div>
                <p className="text-lg font-semibold text-wolf-ink">
                  {adminMe.firstName} {adminMe.lastName}
                </p>
                <p className="text-sm text-wolf-subtle">Rol: {adminMe.role}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded border border-wolf-border bg-wolf-muted p-3">
                <dt className="text-xs font-semibold text-wolf-subtle">
                  Usuario
                </dt>
                <dd className="mt-1 text-sm font-medium text-wolf-ink">{adminMe.username}</dd>
              </div>
              <div className="rounded border border-wolf-border bg-wolf-muted p-3">
                <dt className="text-xs font-semibold text-wolf-subtle">
                  Teléfono
                </dt>
                <dd className="mt-1 text-sm font-medium text-wolf-ink">{adminMe.phoneNumber || "No definido"}</dd>
              </div>
              <div className="rounded border border-wolf-border bg-wolf-muted p-3 sm:col-span-2">
                <dt className="text-xs font-semibold text-wolf-subtle">
                  Emergencia
                </dt>
                <dd className="mt-1 text-sm font-medium text-wolf-ink">
                  {adminMe.profile?.profile_emergency_phone || "No definido"}
                </dd>
              </div>
              <div className="rounded border border-wolf-border bg-wolf-muted p-3 sm:col-span-2">
                <dt className="text-xs font-semibold text-wolf-subtle">
                  DNI
                </dt>
                <dd className="mt-1 text-sm font-medium text-wolf-ink">
                  {adminMe.profile?.documentNumber || "No definido"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                className="bg-wolf-primary font-semibold text-wolf-ink hover:bg-yellow-300"
                onClick={() => setShowProfileModal(true)}
              >
                Editar perfil
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
          userDocumentNumber={adminMe?.profile?.documentNumber ?? ""}
          userRole={adminMe?.role ?? session?.user?.role ?? "admin"}
          profileImage={adminMe?.image ?? session?.user?.image ?? ""}
        />
      )}
    </div>
  );
}

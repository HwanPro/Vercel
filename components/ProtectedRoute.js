import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children, roleRequired }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Espera a que la sesión se cargue
    if (!session) {
      signIn(); // Redirige al login si no hay sesión
    } else if (roleRequired && session.user.role !== roleRequired) {
      router.push("/unauthorized"); // Redirige si no tiene el rol requerido
    }
  }, [session, status, roleRequired, router]); // Dependencias

  if (status === "loading" || (roleRequired && session?.user.role !== roleRequired)) {
    return <p>Cargando...</p>; // Puedes cambiar esto por un spinner
  }

  return <>{children}</>;
}

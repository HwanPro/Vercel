// src/components/AdminOnly.tsx
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminOnly({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push("/login");
    return null;
  }

  // Aquí podrías verificar un rol específico para admins
  if (session.user?.role !== "admin") {
    router.push("/dashboard");
    return null;
  }

  return <>{children}</>;
}

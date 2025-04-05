// src/components/ClientOnly.tsx
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push("/login");
    return null;
  }

  return <>{children}</>;
}

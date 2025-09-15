// app/auth/verify-email/page.tsx
import { Suspense } from "react";
import VerifyEmailClient from "./verify-email-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Verificando…</div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}

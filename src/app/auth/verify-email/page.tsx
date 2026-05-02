// app/auth/verify-email/page.tsx
import { Suspense } from "react";
import VerifyEmailClient from "./verify-email-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#F5F5F4] text-[#0A0A0A]">
          Verificando...
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}

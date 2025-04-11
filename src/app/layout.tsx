"use client";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <SessionProvider>
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <link rel="icon" href="/favicon.ico" />
          {/* Carga de Culqi con Next/Script */}
          <Script
            src="https://checkout.culqi.com/js/v4"
            strategy="beforeInteractive"
          />
        </head>
        <body className="bg-gray-100 text-black">{children}</body>
      </html>
    </SessionProvider>
  );
}

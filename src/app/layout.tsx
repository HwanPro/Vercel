"use client";

import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <html lang="en">
        <head>
          {/* Agregamos el script de Culqi */}
          <Script
            src="https://checkout.culqi.com/js/v4"
            strategy="beforeInteractive"
          />
        </head>
        <body className="bg-gray-100 text-black">
          {children}
        </body>
      </html>
    </SessionProvider>
  );
}

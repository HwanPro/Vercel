"use client";

import "./globals.css";
import { SessionProvider } from "next-auth/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <html lang="en">
        <body className="bg-gray-100 text-black">
          {children}
        </body>
      </html>
    </SessionProvider>
  );
}

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
      <html lang="es">
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Wolf Gym - Gimnasio en Ica | Equipos de Calidad</title>
          <meta 
            name="description" 
            content="Wolf Gym en Ica - El mejor gimnasio con equipos de calidad, entrenadores expertos y planes accesibles. Libera tu lobo interior. ¡Prohibido rendirse!" 
          />
          <meta 
            name="keywords" 
            content="gimnasio Ica, Wolf Gym, fitness Ica, entrenamiento personal, equipos gimnasio, membresías gimnasio, gym Ica Peru" 
          />
          <meta name="author" content="Wolf Gym" />
          <meta name="robots" content="index, follow" />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Wolf Gym - Gimnasio en Ica | Equipos de Calidad" />
          <meta 
            property="og:description" 
            content="El mejor gimnasio de Ica con equipos de calidad, entrenadores expertos y planes accesibles. Libera tu lobo interior." 
          />
          <meta property="og:image" content="/uploads/images/logo2.jpg" />
          <meta property="og:url" content="https://wolfgym.com" />
          <meta property="og:site_name" content="Wolf Gym" />
          <meta property="og:locale" content="es_PE" />
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Wolf Gym - Gimnasio en Ica | Equipos de Última Tecnología" />
          <meta 
            name="twitter:description" 
            content="El mejor gimnasio de Ica con equipos de calidad, entrenadores expertos y planes accesibles. Libera tu lobo interior." 
          />
          <meta name="twitter:image" content="/uploads/images/logo2.jpg" />
          
          {/* Local Business Schema */}
          <script
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Gym",
                "name": "Wolf Gym",
                "description": "Gimnasio en Ica con equipos de calidad y entrenadores expertos",
                "url": "https://wolfgym.com",
                "telephone": "+51-XXX-XXX-XXX",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Av. Peru 622",
                  "addressRegion": "Ica",
                  "postalCode": "11003",
                  "addressCountry": "PE"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": -14.0678,
                  "longitude": -75.7286
                },
                "openingHours": [
                  "Mo-Fr 06:00-21:00",
                  "Sa 06:00-20:00"
                ],
                "priceRange": "S/60 - S/350",
                "image": "/uploads/images/logo2.jpg",
                "sameAs": [
                  "https://www.facebook.com/wolfgym",
                  "https://www.instagram.com/wolfgym"
                ]
              })
            }}
          />
          
          <link rel="icon" href="/favicon.ico" />
          <link rel="canonical" href="https://wolfgym.com" />
          
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

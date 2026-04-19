import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://wolfgym.com"),
  title: "Wolf Gym - Gimnasio en Ica | Equipos de Calidad",
  description:
    "Wolf Gym en Ica - El mejor gimnasio con equipos de calidad, entrenadores expertos y planes accesibles. Libera tu lobo interior.",
  keywords: [
    "gimnasio Ica",
    "Wolf Gym",
    "fitness Ica",
    "entrenamiento personal",
    "membresias gimnasio",
    "gym Ica Peru",
  ],
  authors: [{ name: "Wolf Gym" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "Wolf Gym - Gimnasio en Ica | Equipos de Calidad",
    description:
      "El mejor gimnasio de Ica con equipos de calidad, entrenadores expertos y planes accesibles.",
    siteName: "Wolf Gym",
    locale: "es_PE",
    url: "https://wolfgym.com",
    images: [{ url: "/uploads/images/logo2.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wolf Gym - Gimnasio en Ica | Equipos de Calidad",
    description:
      "El mejor gimnasio de Ica con equipos de calidad, entrenadores expertos y planes accesibles.",
    images: ["/uploads/images/logo2.jpg"],
  },
  icons: { icon: "/favicon.ico" },
  alternates: { canonical: "https://wolfgym.com" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "Gym",
    name: "Wolf Gym",
    description:
      "Gimnasio en Ica con equipos de calidad y entrenadores expertos",
    url: "https://wolfgym.com",
    telephone: "+51-XXX-XXX-XXX",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. Peru 622",
      addressRegion: "Ica",
      postalCode: "11003",
      addressCountry: "PE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -14.0678,
      longitude: -75.7286,
    },
    openingHours: ["Mo-Fr 06:00-21:00", "Sa 06:00-20:00"],
    priceRange: "S/60 - S/350",
    image: "/uploads/images/logo2.jpg",
    sameAs: [
      "https://www.facebook.com/wolfgym",
      "https://www.instagram.com/wolfgym",
    ],
  };

  return (
    <html lang="es">
      <body className="min-h-dvh bg-black text-white antialiased overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

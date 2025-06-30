"use client";

import useSWR from "swr";
import Image from "next/image";
import { Button } from "@/ui/button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LandingPage() {
  const { data: plans, error: plansError } = useSWR("/api/plans", fetcher, {
    refreshInterval: 30000,
  });
  const { data: stories, error: storiesError } = useSWR(
    "/api/stories",
    fetcher,
    { refreshInterval: 30000 }
  );
  const { data: gallery, error: galleryError } = useSWR(
    "/api/gallery",
    fetcher,
    { refreshInterval: 30000 }
  );

  if (plansError || storiesError || galleryError) {
    return <div>Error al cargar la información.</div>;
  }
  if (
    plansError ||
    storiesError ||
    galleryError ||
    !Array.isArray(plans) ||
    !Array.isArray(stories) ||
    !Array.isArray(gallery)
  ) {
    return <div>Error al cargar la información.</div>;
  }

  return (
    <div className="p-6">
      <section>
        <h1 className="text-3xl font-bold">Planes de Membresía</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map(
            (plan: {
              id: string;
              name: string;
              price: number;
              description: string;
            }) => (
              <div key={plan.id} className="border p-4 rounded">
                <h2 className="text-xl">{plan.name}</h2>
                <p>S/ {plan.price}</p>
                <p>{plan.description}</p>
                <Button onClick={() => (window.location.href = "/plans")}>
                  Ver más
                </Button>
              </div>
            )
          )}
        </div>
      </section>

      <section className="mt-10">
        <h1 className="text-3xl font-bold">Noticias y Promociones</h1>
        {stories.map(
          (story: {
            id: string;
            title: string;
            content: string;
            imageUrl?: string;
            link?: string;
          }) => (
            <div key={story.id} className="border p-4 rounded my-4">
              <h2 className="text-xl">{story.title}</h2>
              <p>{story.content}</p>
              {story.imageUrl && (
                <Image
                  src={story.imageUrl}
                  alt={story.title}
                  width={400}
                  height={300}
                  className="rounded"
                />
              )}
              {story.link && (
                <a
                  href={story.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  Ver más
                </a>
              )}
            </div>
          )
        )}
      </section>

      <section className="mt-10">
        <h1 className="text-3xl font-bold">Galería de Fotos</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {gallery.map((img: { id: string; imageUrl: string }) => (
            <div key={img.id}>
              <Image
                src={img.imageUrl}
                alt="Imagen de galería"
                width={400}
                height={300}
                className="rounded"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

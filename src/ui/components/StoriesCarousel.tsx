"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Story {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  link?: string;
}

export default function StoriesCarousel() {
  const [stories, setStories] = useState<Story[]>([]);
  const [current, setCurrent] = useState(0);

  const fetchStories = async () => {
    try {
      const res = await fetch("/api/stories");

      if (!res.ok) {
        throw new Error(`Error en la respuesta del servidor: ${res.status}`);
      }

      const data = await res.json();
      setStories(data);
    } catch (error) {
      console.error("Error al cargar stories:", error);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % stories.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [stories]);

  if (stories.length === 0) return <p>No hay promociones por el momento.</p>;

  return (
    <div className="relative w-full py-12 md:py-24 lg:py-32 max-w-lg mx-auto bg-yellow-400 rounded-lg shadow-lg overflow-hidden">
      <div className="relative h-64">
        <Image
          src={stories[current].imageUrl}
          alt={stories[current].title}
          fill
          unoptimized // 👈 Esto soluciona el error rápido, quítalo si configuras el dominio
          className="object-cover"
        />
      </div>
      <div className="p-4 bg-white text-black">
        <h3 className="font-bold text-lg">{stories[current].title}</h3>
        <p className="text-sm">{stories[current].content}</p>
        {stories[current].link && (
          <a
            href={stories[current].link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-500 underline mt-2 inline-block"
          >
            Ver más
          </a>
        )}
      </div>
      <button
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full text-white"
        onClick={() =>
          setCurrent((prev) => (prev === 0 ? stories.length - 1 : prev - 1))
        }
      >
        <ChevronLeft />
      </button>
      <button
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full text-white"
        onClick={() => setCurrent((prev) => (prev + 1) % stories.length)}
      >
        <ChevronRight />
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, Filter, Plus, Search } from "lucide-react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";

interface ExerciseItem {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  level: string;
  isPublished: boolean;
}

export default function AdminRoutinesPage() {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [level, setLevel] = useState("");
  const [items, setItems] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("published", "true");
      if (query) params.set("query", query);
      if (muscle) params.set("muscle", muscle);
      if (equipment) params.set("equipment", equipment);
      if (level) params.set("level", level);
      params.set("limit", "50");
      const res = await fetch(`/api/exercises?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
          <Dumbbell className="h-5 w-5" /> Biblioteca de ejercicios
        </h1>
        <Link href="#" className="no-underline">
          <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
            <Plus className="h-4 w-4 mr-2" /> Nuevo ejercicio (próximo)
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white text-black rounded-md p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Búsqueda</label>
            <div className="flex gap-2">
              <Input placeholder="Nombre / descripción" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Button variant="outline" onClick={load}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600">Músculo</label>
            <Input placeholder="Pecho / Dorsales / ..." value={muscle} onChange={(e) => setMuscle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Equipo</label>
            <Input placeholder="Barra / Mancuernas / ..." value={equipment} onChange={(e) => setEquipment(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Nivel</label>
            <Input placeholder="beginner / intermediate / advanced" value={level} onChange={(e) => setLevel(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" onClick={load}>
            <Filter className="h-4 w-4 mr-1" /> Aplicar
          </Button>
          <Button variant="ghost" onClick={() => { setQuery(""); setMuscle(""); setEquipment(""); setLevel(""); load(); }}>
            Limpiar
          </Button>
        </div>
      </div>

      {/* Grid resultados */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full text-center text-yellow-400">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full text-center text-gray-400">Sin resultados</div>
        ) : (
          items.map((ex) => (
            <div key={ex.id} className="bg-white text-black rounded-md p-4 space-y-1">
              <div className="font-semibold">{ex.name}</div>
              <div className="text-xs text-gray-600">{ex.primaryMuscle} • {ex.equipment} • {ex.level}</div>
              <div className="text-xs mt-1">{ex.isPublished ? "Publicado" : "Borrador"}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

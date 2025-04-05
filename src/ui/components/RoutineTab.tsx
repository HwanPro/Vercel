"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";

interface RoutinesTabProps {
  gender: "male" | "female";
}
interface RoutinesTabProps {
    gender: "male" | "female";
    fitnessGoal: string;
    setFitnessGoal: (value: string) => void;
    bodyFocus: string;
    setBodyFocus: (value: string) => void;
  }
  
export default function RoutinesTab({ gender }: RoutinesTabProps) {
  const [fitnessGoal, setFitnessGoal] = useState<string>(
    gender === "female" ? "glutes" : "strength"
  );

  const getWorkoutSuggestions = (
    gender: "male" | "female",
    goal: string
  ): string[] => {
    const workouts = {
      female: {
        glutes: [
          "Sentadillas con peso",
          "Hip Thrust",
          "Peso muerto rumano",
          "Elevaciones de cadera",
        ],
        strength: [
          "Press de banca",
          "Dominadas asistidas",
          "Press militar",
          "Remo con barra",
        ],
      },
      male: {
        strength: [
          "Press de banca",
          "Sentadillas",
          "Peso muerto",
          "Press militar",
        ],
        mass: [
          "Press de banca inclinado",
          "Remo con mancuernas",
          "Curl de bíceps",
          "Extensiones de tríceps",
        ],
      },
    };

    return (
      workouts[gender][goal as keyof (typeof workouts)[typeof gender]] || []
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Objetivo</Label>
          <Select onValueChange={setFitnessGoal} defaultValue={fitnessGoal}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecciona un objetivo" />
            </SelectTrigger>
            <SelectContent>
              {gender === "female" ? (
                <>
                  <SelectItem value="glutes">Aumento de Glúteos</SelectItem>
                  <SelectItem value="strength">Fuerza General</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="strength">Fuerza</SelectItem>
                  <SelectItem value="mass">Masa Muscular</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg">
        <h3 className="font-semibold mb-4">Rutina Sugerida</h3>
        <ul className="space-y-2">
          {getWorkoutSuggestions(gender, fitnessGoal).map((workout, index) => (
            <li key={index} className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-yellow-400" />
              {workout}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

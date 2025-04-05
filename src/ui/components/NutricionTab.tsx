"use client";

import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";

interface NutritionTabProps {
    gender: "male" | "female";
  }
  

export default function NutritionTab({ gender }: NutritionTabProps) {
  const [weight, setWeight] = useState<number>(70);
  const [height, setHeight] = useState<number>(170);
  const [age, setAge] = useState<number>(25);
  const [goal, setGoal] = useState<"loss" | "maintenance" | "gain">(
    "maintenance"
  );
  const [calories, setCalories] = useState<number | null>(null);
  const [protein, setProtein] = useState<number | null>(null);
  const [carbs, setCarbs] = useState<number | null>(null);
  const [fats, setFats] = useState<number | null>(null);

  const calculateCalories = (
    weight: number,
    height: number,
    age: number,
    gender: "male" | "female",
    goal: "loss" | "maintenance" | "gain"
  ) => {
    // Harris-Benedict Formula
    const bmr =
      gender === "male"
        ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
        : 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;

    // Activity factor (moderate exercise 3-5 days/week)
    const tdee = bmr * 1.55;

    // Adjust based on goal
    switch (goal) {
      case "loss":
        return tdee - 500;
      case "gain":
        return tdee + 500;
      default:
        return tdee;
    }
  };

  const handleCalculate = () => {
    const resultCalories = calculateCalories(weight, height, age, gender, goal);
    setCalories(resultCalories);
    setProtein(Math.round((resultCalories * 0.25) / 4));
    setCarbs(Math.round((resultCalories * 0.5) / 4));
    setFats(Math.round((resultCalories * 0.25) / 9));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input
            id="weight"
            type="number"
            className="bg-white"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            className="bg-white"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Edad</Label>
          <Input
            id="age"
            type="number"
            className="bg-white"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Objetivo</Label>
          <Select
            onValueChange={(value: "loss" | "maintenance" | "gain") => setGoal(value)}
            defaultValue="maintenance"
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecciona un objetivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="loss">Pérdida de peso</SelectItem>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
              <SelectItem value="gain">Ganancia de masa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
          onClick={handleCalculate}
        >
          Calcular
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg">
        <h3 className="font-semibold mb-4">Plan Nutricional</h3>
        {calories !== null ? (
          <div className="space-y-2">
            <p>
              Calorías diarias:{" "}
              <span className="text-yellow-400">
                {calories.toFixed(0)} kcal
              </span>
            </p>
            <p>
              Proteínas: <span className="text-yellow-400">{protein}g</span>
            </p>
            <p>
              Carbohidratos: <span className="text-yellow-400">{carbs}g</span>
            </p>
            <p>
              Grasas: <span className="text-yellow-400">{fats}g</span>
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Ingrese sus datos y calcule su plan.</p>
        )}
      </div>
    </div>
  );
}

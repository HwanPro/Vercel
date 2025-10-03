// src/ui/components/MembershipSelection.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { format } from "date-fns";

const plans = [
  { name: "Mensual", price: 60, duration: 30 },
  { name: "Básico", price: 100, duration: 30 },
  { name: "Pro", price: 150, duration: 90 },
  { name: "Elite", price: 350, duration: 365 },
];

interface MembershipSelectionProps {
  onPlanSelect: (plan: string, startDate: string, endDate: string) => void;
}

export default function MembershipSelection({
  onPlanSelect,
}: MembershipSelectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState<number>(1);

  const handlePlanSelect = (planName: string, duration: number) => {
    setSelectedPlan(planName);
    const start = new Date();
    const formattedStart = format(start, "yyyy-MM-dd");
    const end = new Date(start);
    end.setDate(end.getDate() + (duration * multiplier));
    const formattedEnd = format(end, "yyyy-MM-dd");
    onPlanSelect(planName, formattedStart, formattedEnd);
  };

  const handleMultiplierChange = (newMultiplier: number) => {
    setMultiplier(newMultiplier);
    if (selectedPlan) {
      const plan = plans.find(p => p.name === selectedPlan);
      if (plan) {
        handlePlanSelect(plan.name, plan.duration);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-yellow-400 text-center">
        Seleccionar Membresía
      </h2>
      
      {/* Aumentador de meses */}
      <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400/40">
        <div className="flex items-center justify-between mb-3">
          <label className="text-yellow-400 font-semibold">
            Cantidad de períodos:
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleMultiplierChange(Math.max(1, multiplier - 1))}
              className="bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-500 font-bold"
              disabled={multiplier <= 1}
            >
              -
            </button>
            <span className="text-white text-xl font-bold min-w-[2rem] text-center">
              {multiplier}
            </span>
            <button
              onClick={() => handleMultiplierChange(multiplier + 1)}
              className="bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-500 font-bold"
            >
              +
            </button>
          </div>
        </div>
        <p className="text-gray-400 text-sm">
          Multiplica la duración del plan seleccionado por {multiplier} período{multiplier > 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full overflow-hidden">
        {plans.map((plan) => {
          const totalDuration = plan.duration * multiplier;
          const totalPrice = plan.price * multiplier;
          const durationText = plan.duration === 30
            ? plan.name === "Mensual"
              ? multiplier === 1 ? "1 mes" : `${multiplier} meses`
              : multiplier === 1 ? "1 mes (Por Pareja)" : `${multiplier} meses (Por Pareja)`
            : plan.duration === 90
              ? multiplier === 1 ? "3 meses" : `${multiplier * 3} meses`
              : multiplier === 1 ? "1 año" : `${multiplier} años`;

          return (
            <Card
              key={plan.name}
              onClick={() => handlePlanSelect(plan.name, plan.duration)}
              className={`cursor-pointer text-center border-2 transition-transform duration-200 
            ${selectedPlan === plan.name ? "border-yellow-400 scale-105 shadow-xl" : "border-gray-600"}
            hover:border-yellow-400 hover:scale-105
          `}
            >
              <CardHeader>
                <CardTitle className="text-yellow-400 text-lg">
                  {plan.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">S/{totalPrice}.00</p>
                <p className="text-sm text-gray-400 mt-1">
                  {durationText}
                </p>
                {multiplier > 1 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    {plan.duration} días × {multiplier} = {totalDuration} días
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

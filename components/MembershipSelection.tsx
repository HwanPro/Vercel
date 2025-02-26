"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handlePlanSelect = (plan: string, duration: number) => {
    setSelectedPlan(plan);
    const start = new Date();
    const formattedStart = format(start, "yyyy-MM-dd");
    const end = new Date(start);
    end.setDate(end.getDate() + duration);
    const formattedEnd = format(end, "yyyy-MM-dd");
    // Se llama al callback inmediatamente para actualizar el padre
    onPlanSelect(plan, formattedStart, formattedEnd);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-yellow-400 text-center">
        Seleccionar Membresía
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`cursor-pointer transition-all text-center border-2 shadow-lg rounded-xl
              ${selectedPlan === plan.name ? "border-yellow-400 shadow-yellow-400/50" : "border-gray-600"}
              hover:shadow-lg hover:border-yellow-300`}
            onClick={() => handlePlanSelect(plan.name, plan.duration)}
          >
            <CardHeader>
              <CardTitle className="text-yellow-400 text-lg">
                {plan.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <p className="text-2xl font-bold">S/{plan.price}.00</p>
              <p className="text-sm text-gray-400">
                {plan.duration === 30
                  ? "Por mes"
                  : plan.duration === 90
                    ? "Por 3 meses"
                    : "Por año"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

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

  const handlePlanSelect = (planName: string, duration: number) => {
    setSelectedPlan(planName);
    const start = new Date();
    const formattedStart = format(start, "yyyy-MM-dd");
    const end = new Date(start);
    end.setDate(end.getDate() + duration);
    const formattedEnd = format(end, "yyyy-MM-dd");
    onPlanSelect(planName, formattedStart, formattedEnd);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-yellow-400 text-center">
        Seleccionar Membresía
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full overflow-hidden">
        {plans.map((plan) => (
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
              <p className="text-2xl font-bold">S/{plan.price}.00</p>
              <p className="text-sm text-gray-400 mt-1">
                {plan.duration === 30
                  ? plan.name === "Mensual"
                    ? "1 mes"
                    : "1 mes (Por Pareja)"
                  : plan.duration === 90
                    ? "3 meses"
                    : "1 año"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

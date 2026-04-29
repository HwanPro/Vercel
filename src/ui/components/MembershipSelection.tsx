// src/ui/components/MembershipSelection.tsx
"use client";

import { useState } from "react";
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
    const plan = plans.find((item) => item.name === selectedPlan);
    if (!plan) return;

    setSelectedPlan(plan.name);
    const start = new Date();
    const formattedStart = format(start, "yyyy-MM-dd");
    const end = new Date(start);
    end.setDate(end.getDate() + plan.duration * newMultiplier);
    onPlanSelect(plan.name, formattedStart, format(end, "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-wolf-subtle">
            Membresía
          </p>
          <h3 className="text-base font-bold text-wolf-ink">
            Selecciona plan y duración
          </h3>
        </div>

        <div className="rounded-md border border-wolf-border bg-white p-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-wolf-subtle">
              Periodos
            </span>
            <button
              type="button"
              onClick={() => handleMultiplierChange(Math.max(1, multiplier - 1))}
              className="grid h-8 w-8 place-items-center rounded-md border border-wolf-border bg-wolf-muted text-base font-black text-wolf-ink hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={multiplier <= 1}
            >
              -
            </button>
            <span className="min-w-8 text-center text-base font-black text-wolf-ink">
              {multiplier}
            </span>
            <button
              type="button"
              onClick={() => handleMultiplierChange(multiplier + 1)}
              className="grid h-8 w-8 place-items-center rounded-md bg-wolf-primary text-base font-black text-wolf-ink hover:bg-yellow-300"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
            <button
              type="button"
              key={plan.name}
              onClick={() => handlePlanSelect(plan.name, plan.duration)}
              className={`rounded-md border p-3 text-left transition-colors ${
                selectedPlan === plan.name
                  ? "border-wolf-primary-strong bg-wolf-primary text-wolf-ink shadow-sm"
                  : "border-wolf-border bg-white text-wolf-ink hover:border-wolf-primary-strong"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black">{plan.name}</p>
                  <p
                    className={`mt-1 text-xs ${
                      selectedPlan === plan.name ? "text-black/70" : "text-wolf-subtle"
                    }`}
                  >
                    {durationText}
                  </p>
                </div>
                <p className="shrink-0 text-base font-black">S/{totalPrice}</p>
              </div>
              <div className="mt-2 min-h-4">
                {multiplier > 1 && (
                  <p
                    className={`text-xs ${
                      selectedPlan === plan.name ? "text-black/65" : "text-wolf-primary-strong"
                    }`}
                  >
                    {plan.duration} días x {multiplier} = {totalDuration} días
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

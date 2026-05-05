export type MembershipPlanView = {
  id?: string;
  name: string;
  price: number;
  description?: string;
  slug?: string;
  amountCents: number;
  durationDays: number;
};

export const DEFAULT_MEMBERSHIP_PLANS: MembershipPlanView[] = [
  {
    name: "Por Dia",
    price: 8,
    description: "Acceso ilimitado al gimnasio - Por Dia",
    slug: "plan-dia",
    amountCents: 800,
    durationDays: 1,
  },
  {
    name: "Plan Mes",
    price: 70,
    description: "Acceso ilimitado al gimnasio - Por Mes",
    slug: "plan-mes",
    amountCents: 7000,
    durationDays: 30,
  },
  {
    name: "Plan Pro",
    price: 120,
    description: "Entrenamiento personalizado - Por 2 Meses",
    slug: "plan-pro",
    amountCents: 12000,
    durationDays: 60,
  },
  {
    name: "Plan Elite",
    price: 350,
    description: "Acceso ilimitado y entrenamiento personalizado - Hasta fin de año",
    slug: "plan-elite",
    amountCents: 35000,
    durationDays: 365,
  },
];

export function inferPlanDurationDays(plan: {
  name?: string | null;
  description?: string | null;
  slug?: string | null;
}) {
  const text = `${plan.name || ""} ${plan.description || ""} ${plan.slug || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/\bdia\b|por dia|day/.test(text)) return 1;
  if (/2\s*mes|dos\s*mes/.test(text)) return 60;
  if (/3\s*mes|tres\s*mes|trimes/.test(text)) return 90;
  if (/6\s*mes|seis\s*mes|semes/.test(text)) return 180;
  if (/ano|anual|365|elite|fin de ano/.test(text)) return 365;
  return 30;
}

export function toMembershipPlanView(plan: {
  id?: string;
  name: string;
  price: number;
  description?: string | null;
  slug?: string | null;
}): MembershipPlanView {
  const price = Number(plan.price || 0);
  return {
    id: plan.id,
    name: plan.name,
    price,
    description: plan.description || "",
    slug: plan.slug || "",
    amountCents: Math.round(price * 100),
    durationDays: inferPlanDurationDays(plan),
  };
}

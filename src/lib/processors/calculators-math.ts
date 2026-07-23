/** معادلات حاسبات السعرات والقروض */

export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "athlete";
export type Goal = "lose" | "maintain" | "gain";

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export const ACTIVITY_LABELS_AR: Record<ActivityLevel, string> = {
  sedentary: "خامل (مكتبي)",
  light: "خفيف (1–3 أيام/أسبوع)",
  moderate: "متوسط (3–5 أيام)",
  active: "نشيط (6–7 أيام)",
  athlete: "رياضي مكثف",
};

export function calcBmr(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  // Mifflin–St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calcTdee(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_FACTOR[activity];
}

export function calcBmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategoryAr(bmi: number): string {
  if (bmi < 18.5) return "نقص وزن";
  if (bmi < 25) return "طبيعي";
  if (bmi < 30) return "زيادة وزن";
  return "سمنة";
}

/** تقدير الكتلة العضلية التقريبي من معادلة Boer */
export function leanBodyMassKg(
  sex: Sex,
  weightKg: number,
  heightCm: number,
): number {
  if (sex === "male") {
    return 0.407 * weightKg + 0.267 * heightCm - 19.2;
  }
  return 0.252 * weightKg + 0.473 * heightCm - 48.3;
}

export function goalCalories(tdee: number, goal: Goal): number {
  if (goal === "lose") return Math.max(1200, tdee - 500);
  if (goal === "gain") return tdee + 350;
  return tdee;
}

export type MacroSplit = {
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinKcal: number;
  carbsKcal: number;
  fatKcal: number;
};

export function macrosFromCalories(
  calories: number,
  weightKg: number,
  goal: Goal,
): MacroSplit {
  const proteinPerKg = goal === "lose" ? 2.0 : goal === "gain" ? 1.8 : 1.6;
  const proteinG = proteinPerKg * weightKg;
  const fatG = Math.max(0.7 * weightKg, (calories * 0.25) / 9);
  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;
  const carbsKcal = Math.max(0, calories - proteinKcal - fatKcal);
  const carbsG = carbsKcal / 4;
  return {
    proteinG,
    carbsG,
    fatG,
    proteinKcal,
    carbsKcal,
    fatKcal,
  };
}

export type MealPlan = {
  name: string;
  share: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export function distributeMeals(
  calories: number,
  macros: MacroSplit,
  meals: number,
): MealPlan[] {
  const n = Math.min(6, Math.max(3, meals));
  const shares =
    n === 3
      ? [0.3, 0.4, 0.3]
      : n === 4
        ? [0.25, 0.3, 0.25, 0.2]
        : n === 5
          ? [0.2, 0.25, 0.2, 0.2, 0.15]
          : [0.18, 0.22, 0.18, 0.18, 0.14, 0.1];
  const names =
    n === 3
      ? ["الفطور", "الغداء", "العشاء"]
      : n === 4
        ? ["الفطور", "الغداء", "وجبة خفيفة", "العشاء"]
        : n === 5
          ? ["الفطور", "وجبة منتصف", "الغداء", "وجبة خفيفة", "العشاء"]
          : [
              "الفطور",
              "وجبة منتصف",
              "الغداء",
              "وجبة بعد الظهر",
              "العشاء",
              "قبل النوم",
            ];
  return shares.map((share, i) => ({
    name: names[i]!,
    share,
    calories: calories * share,
    proteinG: macros.proteinG * share,
    carbsG: macros.carbsG * share,
    fatG: macros.fatG * share,
  }));
}

export type LoanResult = {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[];
};

export function calculateLoan(
  principal: number,
  annualRatePercent: number,
  years: number,
): LoanResult {
  const n = Math.max(1, Math.round(years * 12));
  const r = annualRatePercent / 100 / 12;
  let monthlyPayment: number;
  if (r === 0) {
    monthlyPayment = principal / n;
  } else {
    const pow = Math.pow(1 + r, n);
    monthlyPayment = (principal * r * pow) / (pow - 1);
  }

  let balance = principal;
  const schedule: LoanResult["schedule"] = [];
  for (let month = 1; month <= n; month++) {
    const interest = balance * r;
    const principalPart = Math.min(balance, monthlyPayment - interest);
    balance = Math.max(0, balance - principalPart);
    schedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPart,
      interest,
      balance,
    });
  }

  const totalPayment = monthlyPayment * n;
  return {
    monthlyPayment,
    totalPayment,
    totalInterest: totalPayment - principal,
    schedule,
  };
}

export function formatMoney(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("ar-EG", {
    maximumFractionDigits: digits,
    minimumFractionDigits: Math.min(2, digits),
  });
}

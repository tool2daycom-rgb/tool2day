"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeftRight, RefreshCw } from "lucide-react";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import {
  ACTIVITY_LABELS_AR,
  bmiCategoryAr,
  calcBmi,
  calcBmr,
  calcTdee,
  calculateLoan,
  distributeMeals,
  formatMoney,
  goalCalories,
  leanBodyMassKg,
  macrosFromCalories,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/lib/processors/calculators-math";
import {
  POPULAR_PAIRS,
  WORLD_CURRENCIES,
  currencyLabel,
  getCurrency,
} from "@/lib/processors/world-currencies";
import {
  allKaratGramPrices,
  goldGramPure,
  goldLiraPrices,
  TROY_OUNCE_GRAMS,
} from "@/lib/processors/gold-pricing";
import {
  WORLD_CITIES,
  cityLabel,
  describeOffset,
  formatInTz,
  offsetHours,
} from "@/lib/processors/world-timezones";

export type CalculatorKind =
  | "calorie-calculator"
  | "loan-calculator"
  | "crypto-calculator"
  | "timezone-calculator"
  | "currency-exchange";

type Props = {
  kind: CalculatorKind;
  slug: string;
  title: string;
  description: string;
};

const field =
  "w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm text-[#222] outline-none focus:border-[#2563eb]";

export function CalculatorsWorkspace({ kind, slug, title, description }: Props) {
  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  if (kind === "calorie-calculator") {
    return <CaloriePanel slug={slug} title={title} description={description} />;
  }
  if (kind === "loan-calculator") {
    return <LoanPanel slug={slug} title={title} description={description} />;
  }
  if (kind === "crypto-calculator") {
    return <CryptoPanel slug={slug} title={title} description={description} />;
  }
  if (kind === "timezone-calculator") {
    return <TimezonePanel slug={slug} title={title} description={description} />;
  }
  return <CurrencyPanel slug={slug} title={title} description={description} />;
}

function PanelShell({
  title,
  description,
  children,
  wide,
}: {
  title: string;
  description: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-sm sm:p-6 ${
        wide ? "" : ""
      }`}
    >
      <p className="text-lg font-semibold text-[#111]">{title}</p>
      <p className="mt-1 text-sm leading-7 text-[#666]">{description}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-[#eee] bg-[#fafafa] px-3 py-3">
      <p className="text-[11px] font-semibold text-[#777]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#111] tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-[#888]">{hint}</p> : null}
    </div>
  );
}

/* ───────── Calories ───────── */

function CaloriePanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(28);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [meals, setMeals] = useState(4);

  useEffect(() => {
    beginToolUse(slug);
  }, [slug, sex, age, weight, height, activity, goal, meals]);

  const result = useMemo(() => {
    const bmr = calcBmr(sex, weight, height, age);
    const tdee = calcTdee(bmr, activity);
    const target = goalCalories(tdee, goal);
    const bmi = calcBmi(weight, height);
    const lbm = leanBodyMassKg(sex, weight, height);
    const macros = macrosFromCalories(target, weight, goal);
    const plan = distributeMeals(target, macros, meals);
    return { bmr, tdee, target, bmi, lbm, macros, plan };
  }, [sex, age, weight, height, activity, goal, meals]);

  return (
    <PanelShell title={title} description={description}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-semibold text-[#555]">
          الجنس
          <select className={`${field} mt-1`} value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-[#555]">
          العمر
          <input className={`${field} mt-1`} type="number" min={12} max={100} value={age} onChange={(e) => setAge(Number(e.target.value) || 0)} />
        </label>
        <label className="text-xs font-semibold text-[#555]">
          الوزن (كغ)
          <input className={`${field} mt-1`} type="number" min={30} max={250} value={weight} onChange={(e) => setWeight(Number(e.target.value) || 0)} />
        </label>
        <label className="text-xs font-semibold text-[#555]">
          الطول (سم)
          <input className={`${field} mt-1`} type="number" min={120} max={230} value={height} onChange={(e) => setHeight(Number(e.target.value) || 0)} />
        </label>
        <label className="text-xs font-semibold text-[#555]">
          النشاط
          <select className={`${field} mt-1`} value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)}>
            {(Object.keys(ACTIVITY_LABELS_AR) as ActivityLevel[]).map((k) => (
              <option key={k} value={k}>{ACTIVITY_LABELS_AR[k]}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#555]">
          الهدف
          <select className={`${field} mt-1`} value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
            <option value="lose">خسارة وزن</option>
            <option value="maintain">حفاظ</option>
            <option value="gain">زيادة عضل/وزن</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-[#555]">
          عدد الوجبات
          <input className={`${field} mt-1`} type="number" min={3} max={6} value={meals} onChange={(e) => setMeals(Number(e.target.value) || 3)} />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="BMR (أساسي)" value={`${Math.round(result.bmr)} سعرة`} />
        <Stat label="TDEE (يومي)" value={`${Math.round(result.tdee)} سعرة`} />
        <Stat label="هدف السعرات" value={`${Math.round(result.target)} سعرة`} />
        <Stat label="BMI" value={result.bmi.toFixed(1)} hint={bmiCategoryAr(result.bmi)} />
        <Stat label="كتلة عضلية تقريبية" value={`${result.lbm.toFixed(1)} كغ`} hint="معادلة Boer" />
        <Stat label="بروتين" value={`${Math.round(result.macros.proteinG)} غ`} />
        <Stat label="كربوهيدرات" value={`${Math.round(result.macros.carbsG)} غ`} />
        <Stat label="دهون" value={`${Math.round(result.macros.fatG)} غ`} />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-[#222]">توزيع الوجبات</p>
        <div className="overflow-x-auto rounded-xl border border-[#eee]">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-[#f7f7f7] text-[#555]">
              <tr>
                <th className="px-3 py-2 text-start font-semibold">الوجبة</th>
                <th className="px-3 py-2 text-start font-semibold">سعرات</th>
                <th className="px-3 py-2 text-start font-semibold">بروتين</th>
                <th className="px-3 py-2 text-start font-semibold">كارب</th>
                <th className="px-3 py-2 text-start font-semibold">دهون</th>
              </tr>
            </thead>
            <tbody>
              {result.plan.map((m) => (
                <tr key={m.name} className="border-t border-[#eee]">
                  <td className="px-3 py-2 font-medium">{m.name}</td>
                  <td className="px-3 py-2 tabular-nums">{Math.round(m.calories)}</td>
                  <td className="px-3 py-2 tabular-nums">{Math.round(m.proteinG)} غ</td>
                  <td className="px-3 py-2 tabular-nums">{Math.round(m.carbsG)} غ</td>
                  <td className="px-3 py-2 tabular-nums">{Math.round(m.fatG)} غ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PanelShell>
  );
}

/* ───────── Loan ───────── */

function LoanPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(5.5);
  const [years, setYears] = useState(5);

  useEffect(() => {
    beginToolUse(slug);
  }, [slug, principal, rate, years]);

  const result = useMemo(
    () => calculateLoan(principal, rate, years),
    [principal, rate, years],
  );

  const preview = result.schedule.slice(0, 12);

  return (
    <PanelShell title={title} description={description}>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-[#555]">
          مبلغ القرض
          <input className={`${field} mt-1`} type="number" min={1000} value={principal} onChange={(e) => setPrincipal(Number(e.target.value) || 0)} />
        </label>
        <label className="text-xs font-semibold text-[#555]">
          الفائدة السنوية %
          <input className={`${field} mt-1`} type="number" min={0} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} />
        </label>
        <label className="text-xs font-semibold text-[#555]">
          المدة (سنوات)
          <input className={`${field} mt-1`} type="number" min={0.5} step={0.5} value={years} onChange={(e) => setYears(Number(e.target.value) || 1)} />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label="القسط الشهري" value={formatMoney(result.monthlyPayment)} />
        <Stat label="إجمالي السداد" value={formatMoney(result.totalPayment)} />
        <Stat label="إجمالي الفوائد" value={formatMoney(result.totalInterest)} />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-[#222]">أول 12 قسطاً</p>
        <div className="overflow-x-auto rounded-xl border border-[#eee]">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-[#f7f7f7] text-[#555]">
              <tr>
                <th className="px-3 py-2 text-start">الشهر</th>
                <th className="px-3 py-2 text-start">القسط</th>
                <th className="px-3 py-2 text-start">أصل</th>
                <th className="px-3 py-2 text-start">فائدة</th>
                <th className="px-3 py-2 text-start">المتبقي</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row) => (
                <tr key={row.month} className="border-t border-[#eee]">
                  <td className="px-3 py-2">{row.month}</td>
                  <td className="px-3 py-2 tabular-nums">{formatMoney(row.payment)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatMoney(row.principal)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatMoney(row.interest)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatMoney(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PanelShell>
  );
}

/* ───────── FX helpers ───────── */

type RatesPayload = {
  date: string;
  base: string;
  rates: Record<string, number>;
  fetchedAt?: string;
};

function convertAmount(
  amount: number,
  from: string,
  to: string,
  ratesUsd: Record<string, number>,
): number | null {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return amount;
  const fromUsd = ratesUsd[f];
  const toUsd = ratesUsd[t];
  if (!fromUsd || !toUsd) return null;
  // rates are "1 USD = x CURRENCY"
  const inUsd = amount / fromUsd;
  return inUsd * toUsd;
}

async function fetchUsdRates(): Promise<RatesPayload> {
  const res = await fetch("/api/fx-rates?base=usd", { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "فشل جلب الأسعار");
  return data as RatesPayload;
}

/* ───────── Crypto ───────── */

function CryptoPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const cryptos = WORLD_CURRENCIES.filter((c) => c.kind === "crypto");
  const fiats = WORLD_CURRENCIES.filter((c) => c.kind === "fiat").slice(0, 30);
  const [from, setFrom] = useState("BTC");
  const [to, setTo] = useState("USD");
  const [amount, setAmount] = useState(1);
  const [rates, setRates] = useState<RatesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      beginToolUse(slug);
      setRates(await fetchUsdRates());
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const out = rates
    ? convertAmount(amount, from, to, rates.rates)
    : null;

  return (
    <PanelShell title={title} description={description}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#666]">
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1 rounded-md border border-[#ddd] px-2 py-1 font-semibold hover:bg-[#f7f7f7]">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          تحديث الأسعار
        </button>
        {rates?.date ? <span>تاريخ المصدر: {rates.date}</span> : null}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-[#555]">
          من
          <select className={`${field} mt-1`} value={from} onChange={(e) => setFrom(e.target.value)}>
            {cryptos.map((c) => (
              <option key={c.code} value={c.code}>{currencyLabel(c.code)}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#555]">
          الكمية
          <input className={`${field} mt-1`} type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
        </label>
        <label className="text-xs font-semibold text-[#555]">
          إلى
          <select className={`${field} mt-1`} value={to} onChange={(e) => setTo(e.target.value)}>
            {[...fiats, ...cryptos].map((c) => (
              <option key={c.code} value={c.code}>{currencyLabel(c.code)}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="rounded-xl border border-[#eee] bg-[#fafafa] p-4 text-center">
        <p className="text-sm text-[#666]">
          {amount} {from} =
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-[#111]">
          {out == null ? "…" : formatMoney(out, out < 1 ? 8 : 2)} {to}
        </p>
      </div>
    </PanelShell>
  );
}

/* ───────── Timezone ───────── */

function TimezonePanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [fromId, setFromId] = useState("riyadh");
  const [toId, setToId] = useState("new-york");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    beginToolUse(slug);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [slug]);

  const from = WORLD_CITIES.find((c) => c.id === fromId) || WORLD_CITIES[0]!;
  const to = WORLD_CITIES.find((c) => c.id === toId) || WORLD_CITIES[1]!;
  const diff = offsetHours(from.tz, to.tz, now);

  return (
    <PanelShell title={title} description={description}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[#555]">
          المدينة الأولى
          <select className={`${field} mt-1`} value={fromId} onChange={(e) => setFromId(e.target.value)}>
            {WORLD_CITIES.map((c) => (
              <option key={c.id} value={c.id}>{cityLabel(c)}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#555]">
          المدينة الثانية
          <select className={`${field} mt-1`} value={toId} onChange={(e) => setToId(e.target.value)}>
            {WORLD_CITIES.map((c) => (
              <option key={c.id} value={c.id}>{cityLabel(c)}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#eee] bg-[#fafafa] p-4">
          <p className="text-sm font-semibold">{cityLabel(from)}</p>
          <p className="mt-2 text-xl font-bold tabular-nums">{formatInTz(now, from.tz)}</p>
        </div>
        <div className="rounded-xl border border-[#eee] bg-[#fafafa] p-4">
          <p className="text-sm font-semibold">{cityLabel(to)}</p>
          <p className="mt-2 text-xl font-bold tabular-nums">{formatInTz(now, to.tz)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-900">
        فرق التوقيت: {describeOffset(diff)} ({diff >= 0 ? "+" : ""}
        {diff.toFixed(1)} ساعة)
      </div>
    </PanelShell>
  );
}

/* ───────── Currency + Gold ───────── */

type HistoryPoint = { date: string; rate: number };

function RateChart({ points }: { points: HistoryPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-[#eee] bg-[#fafafa] text-sm text-[#888]">
        جاري تحميل المخطط…
      </div>
    );
  }
  const vals = points.map((p) => p.rate);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const w = 640;
  const h = 160;
  const pad = 8;
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (p.rate - min) / span) * (h - pad * 2);
    return `${x},${y}`;
  });
  const up = points[points.length - 1]!.rate >= points[0]!.rate;
  return (
    <div className="rounded-xl border border-[#eee] bg-white p-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" role="img" aria-label="مخطط سعر الصرف">
        <polyline
          fill="none"
          stroke={up ? "#059669" : "#dc2626"}
          strokeWidth="2.5"
          points={coords.join(" ")}
        />
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-[#888]">
        <span>{points[0]?.date}</span>
        <span>
          {formatMoney(min, 4)} — {formatMoney(max, 4)}
        </span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function CurrencyPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("SAR");
  const [amountFrom, setAmountFrom] = useState(1);
  const [amountTo, setAmountTo] = useState("");
  const [editSide, setEditSide] = useState<"from" | "to">("from");
  const [rates, setRates] = useState<RatesPayload | null>(null);
  const [prevRates, setPrevRates] = useState<RatesPayload | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [range, setRange] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [goldQuote, setGoldQuote] = useState("SAR");

  const rate = useMemo(() => {
    if (!rates) return null;
    return convertAmount(1, from, to, rates.rates);
  }, [rates, from, to]);

  const prevRate = useMemo(() => {
    if (!prevRates) return null;
    return convertAmount(1, from, to, prevRates.rates);
  }, [prevRates, from, to]);

  const change = rate != null && prevRate != null ? rate - prevRate : null;
  const changePct =
    change != null && prevRate ? (change / prevRate) * 100 : null;

  useEffect(() => {
    if (!rates || rate == null) return;
    if (editSide === "from") {
      setAmountTo(
        String(Number((amountFrom * rate).toFixed(rate < 1 ? 8 : 4))),
      );
    } else {
      const n = Number(amountTo) || 0;
      setAmountFrom(Number((n / rate).toFixed(rate < 1 ? 8 : 4)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate, from, to]);

  async function loadRates() {
    setLoading(true);
    setError(null);
    try {
      beginToolUse(slug);
      const latest = await fetchUsdRates();
      setRates(latest);
      try {
        const y = new Date();
        y.setUTCDate(y.getUTCDate() - 1);
        const ymd = y.toISOString().slice(0, 10);
        const res = await fetch(`/api/fx-rates?base=usd&date=${ymd}`, {
          cache: "no-store",
        });
        if (res.ok) setPrevRates((await res.json()) as RatesPayload);
      } catch {
        /* optional */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(days: number) {
    try {
      const res = await fetch(
        `/api/fx-rates?base=${from.toLowerCase()}&quote=${to}&history=${days}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.points)) {
        setHistory(data.points as HistoryPoint[]);
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void loadRates();
    const id = setInterval(() => void loadRates(), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadHistory(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, range]);

  function swap() {
    setFrom(to);
    setTo(from);
    setAmountFrom(Number(amountTo) || 0);
    setEditSide("from");
  }

  const filtered = WORLD_CURRENCIES.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.code.toLowerCase().includes(q) ||
      c.nameAr.includes(query.trim()) ||
      c.nameEn.toLowerCase().includes(q)
    );
  });

  const watchlist = POPULAR_PAIRS.map(([a, b]) => {
    const r = rates ? convertAmount(1, a, b, rates.rates) : null;
    const p = prevRates ? convertAmount(1, a, b, prevRates.rates) : null;
    const d = r != null && p != null ? r - p : null;
    const pct = d != null && p ? (d / p) * 100 : null;
    return { a, b, r, d, pct };
  });

  const goldUsd = rates ? convertAmount(1, "XAU", "USD", rates.rates) : null;
  const goldSar = rates ? convertAmount(1, "XAU", "SAR", rates.rates) : null;
  const silverUsd = rates ? convertAmount(1, "XAG", "USD", rates.rates) : null;
  const goldOunceQuote = rates
    ? convertAmount(1, "XAU", goldQuote, rates.rates)
    : null;
  const karatRows =
    goldOunceQuote != null ? allKaratGramPrices(goldOunceQuote) : null;
  const liraRows =
    goldOunceQuote != null ? goldLiraPrices(goldOunceQuote) : null;
  const gram24 =
    goldOunceQuote != null ? goldGramPure(goldOunceQuote) : null;

  const goldQuoteOptions = WORLD_CURRENCIES.filter((c) => c.kind === "fiat").map(
    (c) => c.code,
  );

  return (
    <PanelShell title={title} description={description} wide>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#666] [font-variant-numeric:lining-nums_tabular-nums]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadRates()}
            className="inline-flex items-center gap-1 rounded-md border border-[#ddd] px-2 py-1 font-semibold hover:bg-[#f7f7f7]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث لحظي
          </button>
          {rates?.date ? <span>آخر تحديث للسوق: {rates.date}</span> : null}
          {rates?.fetchedAt ? (
            <span>
              · سُحب{" "}
              {new Date(rates.fetchedAt).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-[#888]">
          أسعار مجمّعة من مصادر السوق العالمية · تُحدَّث تلقائياً كل دقيقة
        </p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="rounded-2xl border border-[#e8e8e8] bg-gradient-to-b from-[#fafafa] to-white p-4 sm:p-5">
        <p className="text-center text-2xl font-bold tabular-nums text-[#111] sm:text-3xl">
          1 {from} = {rate == null ? "…" : formatMoney(rate, rate < 1 ? 6 : 4)} {to}
        </p>
        {change != null && changePct != null ? (
          <p
            className={`mt-1 text-center text-sm font-semibold ${
              change >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {change >= 0 ? "+" : ""}
            {formatMoney(change, 4)} ({changePct >= 0 ? "+" : ""}
            {changePct.toFixed(2)}%) مقارنة بالأمس
          </p>
        ) : null}

        <div className="mt-5 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-xl border border-[#ddd] bg-white p-3">
            <p className="text-xs font-semibold text-[#777]">من</p>
            <select
              className={`${field} mt-1`}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              {filtered.map((c) => (
                <option key={c.code} value={c.code}>
                  {currencyLabel(c.code)}
                </option>
              ))}
            </select>
            <input
              className={`${field} mt-2 text-lg font-semibold tabular-nums`}
              type="number"
              min={0}
              step="any"
              value={amountFrom}
              onChange={(e) => {
                setEditSide("from");
                setAmountFrom(Number(e.target.value) || 0);
                if (rate != null) {
                  setAmountTo(
                    String(
                      Number(
                        (Number(e.target.value || 0) * rate).toFixed(
                          rate < 1 ? 8 : 4,
                        ),
                      ),
                    ),
                  );
                }
              }}
            />
          </div>

          <button
            type="button"
            onClick={swap}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd] bg-white text-[#333] hover:bg-[#f5f5f5]"
            aria-label="تبديل العملات"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <div className="rounded-xl border border-[#ddd] bg-white p-3">
            <p className="text-xs font-semibold text-[#777]">إلى</p>
            <select
              className={`${field} mt-1`}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            >
              {filtered.map((c) => (
                <option key={`to-${c.code}`} value={c.code}>
                  {currencyLabel(c.code)}
                </option>
              ))}
            </select>
            <input
              className={`${field} mt-2 text-lg font-semibold tabular-nums`}
              type="number"
              min={0}
              step="any"
              value={amountTo}
              onChange={(e) => {
                setEditSide("to");
                setAmountTo(e.target.value);
                if (rate != null && rate !== 0) {
                  setAmountFrom(
                    Number(
                      (Number(e.target.value || 0) / rate).toFixed(
                        rate < 1 ? 8 : 4,
                      ),
                    ),
                  );
                }
              }}
            />
          </div>
        </div>

        <label className="mt-3 block text-xs font-semibold text-[#555]">
          بحث سريع عن عملة
          <input
            className={`${field} mt-1`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="مثال: ذهب، SAR، Euro…"
          />
        </label>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-2 flex flex-wrap gap-1">
            {[
              [5, "5 أيام"],
              [30, "شهر"],
              [90, "3 أشهر"],
              [365, "سنة"],
            ].map(([d, label]) => (
              <button
                key={String(d)}
                type="button"
                onClick={() => setRange(Number(d))}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  range === d
                    ? "bg-[#111] text-white"
                    : "border border-[#ddd] text-[#555] hover:bg-[#f7f7f7]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <RateChart points={history} />
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-amber-950">الذهب والفضة</p>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-amber-900">
                عرض بـ
                <select
                  className="rounded border border-amber-300 bg-white px-1.5 py-0.5 text-xs"
                  value={goldQuote}
                  onChange={(e) => setGoldQuote(e.target.value)}
                >
                  {goldQuoteOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-2 text-sm tabular-nums text-amber-900">
              🥇 أونصة: {goldOunceQuote == null ? "…" : formatMoney(goldOunceQuote)} {goldQuote}
              {goldUsd != null ? ` · ${formatMoney(goldUsd)} USD` : ""}
              {goldSar != null && goldQuote !== "SAR"
                ? ` · ${formatMoney(goldSar)} SAR`
                : ""}
            </p>
            <p className="mt-1 text-sm tabular-nums text-amber-900">
              🥈 أونصة فضة: {silverUsd == null ? "…" : formatMoney(silverUsd)} USD
            </p>
            <p className="mt-1 text-[11px] text-amber-800/80">
              غرام عيار 24 ≈ {gram24 == null ? "…" : formatMoney(gram24)} {goldQuote}
              {" · "}1 أونصة = {TROY_OUNCE_GRAMS} غ
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-semibold"
                onClick={() => {
                  setFrom("XAU");
                  setTo(goldQuote);
                }}
              >
                ذهب → {goldQuote}
              </button>
              <button
                type="button"
                className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-semibold"
                onClick={() => {
                  setFrom("XAU");
                  setTo("USD");
                }}
              >
                ذهب → دولار
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#eee]">
            <p className="border-b border-[#eee] px-3 py-2 text-sm font-bold text-[#222]">
              أزواج شائعة
            </p>
            <ul className="max-h-72 divide-y divide-[#f0f0f0] overflow-y-auto">
              {watchlist.map((row) => (
                <li key={`${row.a}-${row.b}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-start hover:bg-[#fafafa]"
                    onClick={() => {
                      setFrom(row.a);
                      setTo(row.b);
                      setAmountFrom(1);
                      setEditSide("from");
                    }}
                  >
                    <span className="text-sm font-semibold">
                      {getCurrency(row.a).flag}
                      {getCurrency(row.b).flag} {row.a}/{row.b}
                    </span>
                    <span className="text-end">
                      <span className="block text-sm font-bold tabular-nums">
                        {row.r == null ? "…" : formatMoney(row.r, row.r < 1 ? 6 : 4)}
                      </span>
                      {row.pct != null ? (
                        <span
                          className={`text-[11px] font-semibold ${
                            row.pct >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {row.pct >= 0 ? "+" : ""}
                          {row.pct.toFixed(2)}%
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-amber-950">أسعار الذهب</p>
            <p className="mt-0.5 text-[11px] text-amber-900/80">
              غرام لكل العيارات · ربع / نص / ليرة ذهب (عيار 22)
            </p>
          </div>
          <label className="block min-w-[220px] text-xs font-bold text-amber-950">
            اختر عملة العرض
            <select
              className={`${field} mt-1 border-amber-300 bg-white font-semibold`}
              value={goldQuote}
              onChange={(e) => setGoldQuote(e.target.value)}
            >
              {goldQuoteOptions.map((code) => (
                <option key={code} value={code}>
                  {currencyLabel(code)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-amber-200 bg-white p-4">
          <p className="text-sm font-bold text-[#222]">سعر غرام الذهب حسب العيار</p>
          <p className="mt-1 text-[11px] text-[#888]">
            عيارات 24 · 22 · 21 · 18 · 14 · بعملة {goldQuote}
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-[#eee]">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-[#666]">
                <tr>
                  <th className="px-3 py-2 text-start font-semibold">العيار</th>
                  <th className="px-3 py-2 text-start font-semibold">نقاء</th>
                  <th className="px-3 py-2 text-start font-semibold">
                    سعر الغرام ({goldQuote})
                  </th>
                </tr>
              </thead>
              <tbody>
                {(karatRows || []).map((row) => (
                  <tr key={row.karat} className="border-t border-[#eee]">
                    <td className="px-3 py-2 font-semibold">عيار {row.karat}</td>
                    <td className="px-3 py-2 tabular-nums text-[#666]">
                      {((row.karat / 24) * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-base font-bold tabular-nums text-amber-900">
                      {formatMoney(row.perGram)}
                    </td>
                  </tr>
                ))}
                {!karatRows ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-[#888]">
                      جاري التحميل…
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-white p-4">
          <p className="text-sm font-bold text-[#222]">ربع · نص · ليرة ذهب</p>
          <p className="mt-1 text-[11px] text-[#888]">
            أوزان 1.804 / 3.608 / 7.216 غ · عيار 22 · بعملة {goldQuote}
          </p>
          <div className="mt-3 grid gap-2">
            {(liraRows || []).map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-3"
              >
                <div>
                  <p className="font-bold text-amber-950">{row.labelAr}</p>
                  <p className="text-[11px] text-amber-800/80">
                    {row.grams} g · karat {row.karat}
                  </p>
                </div>
                <p className="text-lg font-bold tabular-nums text-amber-950">
                  {formatMoney(row.price)}{" "}
                  <span className="text-xs font-semibold">{goldQuote}</span>
                </p>
              </div>
            ))}
            {!liraRows ? (
              <p className="py-4 text-center text-sm text-[#888]">جاري التحميل…</p>
            ) : null}
          </div>
          <p className="mt-2 text-[10px] leading-5 text-[#999]">
            الأوزان معيارية للسوق (7.216 / 3.608 / 1.804 g). السعر المحلي عند الصاغة قد يختلف قليلاً حسب الأجرة والعمولة.
          </p>
        </div>
      </div>
    </PanelShell>
  );
}

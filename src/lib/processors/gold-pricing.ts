/** تسعير الذهب بالغرام والعيارات والليرة */

/** أونصة تروية بالغرامة */
export const TROY_OUNCE_GRAMS = 31.1034768;

/** عيارات الذهب الشائعة في السوق العربي */
export const GOLD_KARATS = [24, 22, 21, 18, 14] as const;
export type GoldKarat = (typeof GOLD_KARATS)[number];

/**
 * أوزان الليرة الذهبية الجمهورية (Cumhuriyet) الشائعة في الأسواق العربية
 * العيار 22 — الوزن الإجمالي بالغرام
 */
export const GOLD_LIRA = {
  full: { labelAr: "ليرة ذهب", grams: 7.216, karat: 22 as GoldKarat },
  half: { labelAr: "نص ليرة ذهب", grams: 3.608, karat: 22 as GoldKarat },
  quarter: { labelAr: "ربع ليرة ذهب", grams: 1.804, karat: 22 as GoldKarat },
} as const;

/** سعر غرام عيار 24 من سعر أونصة الذهب */
export function goldGramPure(ouncePrice: number): number {
  return ouncePrice / TROY_OUNCE_GRAMS;
}

/** سعر غرام حسب العيار من سعر أونصة 24 قيراط */
export function goldGramByKarat(ouncePrice: number, karat: number): number {
  return goldGramPure(ouncePrice) * (karat / 24);
}

/** سعر قطعة ذهب بوزن وعيار معيّنين */
export function goldPiecePrice(
  ouncePrice: number,
  grams: number,
  karat: number,
): number {
  return goldGramByKarat(ouncePrice, karat) * grams;
}

export function allKaratGramPrices(ouncePrice: number): {
  karat: GoldKarat;
  perGram: number;
}[] {
  return GOLD_KARATS.map((karat) => ({
    karat,
    perGram: goldGramByKarat(ouncePrice, karat),
  }));
}

export function goldLiraPrices(ouncePrice: number): {
  key: keyof typeof GOLD_LIRA;
  labelAr: string;
  grams: number;
  karat: number;
  price: number;
}[] {
  return (Object.keys(GOLD_LIRA) as (keyof typeof GOLD_LIRA)[]).map((key) => {
    const item = GOLD_LIRA[key];
    return {
      key,
      labelAr: item.labelAr,
      grams: item.grams,
      karat: item.karat,
      price: goldPiecePrice(ouncePrice, item.grams, item.karat),
    };
  });
}

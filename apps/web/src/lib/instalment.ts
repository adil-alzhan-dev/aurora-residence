/** Developer instalment plan: 0%, down payment 10-70%, term 6-60 months (spec, "Instalments"). */
export const DOWN_PAYMENT = { min: 10, max: 70, step: 5, initial: 30 } as const;

export const TERM_MONTHS = { min: 6, max: 60, step: 6, initial: 24 } as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Rounded to whole dollars: 7.03 at $218 000, 30% and 24 months gives $65 400 down and $6 358 a month. */
export function calculateInstalments(priceUsd: number, downPaymentPercent: number, months: number) {
  const percent = clamp(downPaymentPercent, DOWN_PAYMENT.min, DOWN_PAYMENT.max);
  const term = clamp(Math.round(months), TERM_MONTHS.min, TERM_MONTHS.max);
  const downPayment = Math.round((priceUsd * percent) / 100);
  const financed = priceUsd - downPayment;
  return { percent, term, downPayment, financed, monthly: Math.round(financed / term) };
}

/** Word forms for Intl.PluralRules categories; English uses one and other, Russian also few and many. */
export type PluralForms = Record<"one" | "few" | "many" | "other", string>;

export const pluralForms = (one: string, few: string, many = few, other = few): PluralForms => ({
  one,
  few,
  many,
  other,
});

const rulesByLocale = new Map<string, Intl.PluralRules>();

export function plural(count: number, forms: PluralForms, intl: string) {
  let rules = rulesByLocale.get(intl);
  if (!rules) {
    rules = new Intl.PluralRules(intl);
    rulesByLocale.set(intl, rules);
  }
  const category = rules.select(count);
  return category in forms ? forms[category as keyof PluralForms] : forms.other;
}

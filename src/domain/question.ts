export interface AnswerOption {
  readonly id: string;
  readonly name: string;
  readonly icon: string | null;
  readonly group: string | null;
  readonly aliases: readonly string[];
}

export type HintVisual =
  | { readonly type: 'text' }
  | { readonly type: 'swatch'; readonly color: string }
  | { readonly type: 'icon'; readonly icon: string; readonly key: string | null }
  | { readonly type: 'key'; readonly key: string };

export interface Hint {
  readonly kind: string;
  readonly label: string;
  readonly value: string;
  readonly visual: HintVisual;
}

export interface ResultDetail {
  readonly label: string;
  readonly value: string;
}

export interface Question {
  readonly id: string;
  readonly answer: AnswerOption;
  readonly image: string;
  readonly hints: readonly Hint[];
  readonly details: readonly ResultDetail[];
}

export const TEXT_VISUAL: HintVisual = { type: 'text' };

export function textHint(kind: string, label: string, value: string | number | null | undefined): Hint | null {
  if (value === null || value === undefined || value === '') return null;
  return { kind, label, value: String(value), visual: TEXT_VISUAL };
}

export function customHints(values: readonly string[]): Hint[] {
  return values.map((value, index) => ({ kind: `custom-${index}`, label: 'Pista', value, visual: TEXT_VISUAL }));
}

export function compactHints(hints: readonly (Hint | null)[]): Hint[] {
  return hints.filter((hint): hint is Hint => hint !== null);
}

export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function lettersOf(value: string): string {
  return value.replace(/[^\p{L}]/gu, '').toUpperCase();
}

export function assertUniqueAnswers(options: readonly AnswerOption[], label: string): void {
  const seen = new Map<string, string>();
  for (const option of options) {
    for (const key of [option.id, normalizeName(option.name), ...option.aliases.map(normalizeName)]) {
      const owner = seen.get(key);
      if (owner !== undefined && owner !== option.id) {
        throw new Error(`Resposta duplicada em ${label}: "${option.name}" conflita com "${owner}".`);
      }
      seen.set(key, option.id);
    }
  }
}

import { normalizeName, type AnswerOption } from './question';

const searchKeys = (option: AnswerOption) => [option.name, ...option.aliases].map(normalizeName);

export function findAnswer(input: string, options: readonly AnswerOption[]): AnswerOption | null {
  const query = normalizeName(input);
  if (!query) return null;
  return options.find((option) => option.id === query || searchKeys(option).includes(query)) ?? null;
}

export function searchAnswers(
  input: string,
  options: readonly AnswerOption[],
  excludedIds: ReadonlySet<string> = new Set(),
  limit = 8,
): AnswerOption[] {
  const query = normalizeName(input);
  if (!query) return [];
  const available = options.filter((option) => !excludedIds.has(option.id));
  const startsWith = available.filter((option) => searchKeys(option).some((key) => key.startsWith(query)));
  const contains = available.filter(
    (option) => !startsWith.includes(option) && searchKeys(option).some((key) => key.includes(query)),
  );
  return [...startsWith, ...contains].slice(0, limit);
}

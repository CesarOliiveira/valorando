export type RandomSource = () => number;

export interface SelectionOptions {
  readonly recentIds: readonly string[];
  readonly avoidRatio: number;
  readonly random?: RandomSource;
  readonly excludeIds?: readonly string[];
}

export function selectQuestion<T extends { readonly id: string }>(pool: readonly T[], options: SelectionOptions): T {
  if (pool.length === 0) throw new Error('Não há desafios disponíveis para este modo.');
  const random = options.random ?? Math.random;
  const blocked = new Set([...recentWindow(pool.length, options), ...(options.excludeIds ?? [])]);
  const candidates = pool.filter((item) => !blocked.has(item.id));
  const fallback = pool.filter((item) => item.id !== options.recentIds.at(-1));
  const choices = candidates.length > 0 ? candidates : fallback.length > 0 ? fallback : pool;
  return choices[Math.floor(random() * choices.length)];
}

export function appendToHistory(history: readonly string[], id: string, maxLength: number): string[] {
  return [...history, id].slice(-maxLength);
}

function recentWindow(poolSize: number, options: SelectionOptions): readonly string[] {
  const avoidCount = Math.max(1, Math.floor(poolSize * options.avoidRatio));
  return options.recentIds.slice(-avoidCount);
}

import type { Ability, AbilityType, Agent } from '../content/types';
import { lettersOf, textHint, type AnswerOption, type Hint } from '../domain/question';
import type { FocusAnchors } from '../domain/rules';

export const FOCUS = {
  portrait: {
    top: { x: 50, y: 18 },
    bottom: { x: 50, y: 82 },
    left: { x: 32, y: 50 },
    right: { x: 68, y: 50 },
    center: { x: 50, y: 45 },
  },
  wide: {
    top: { x: 50, y: 36 },
    bottom: { x: 50, y: 64 },
    left: { x: 16, y: 50 },
    right: { x: 84, y: 50 },
    center: { x: 50, y: 50 },
  },
  icon: {
    top: { x: 50, y: 28 },
    bottom: { x: 50, y: 72 },
    left: { x: 28, y: 50 },
    right: { x: 72, y: 50 },
    center: { x: 50, y: 50 },
  },
} as const satisfies Record<string, FocusAnchors>;

export const ABILITY_TYPE_LABELS: Readonly<Record<AbilityType, string>> = {
  basic: 'Básica',
  signature: 'Assinatura',
  ultimate: 'Ultimate',
};

const MASK = '[oculto]';
const MIN_MASKED_WORD = 3;
const SUMMARY_MIN_LENGTH = 70;
const SUMMARY_MAX_LENGTH = 200;
const CONNECTORS = new Set(['das', 'dos', 'com', 'para']);

export function agentAnswer(agent: Agent): AnswerOption {
  return { id: agent.id, name: agent.name, icon: agent.icon, group: agent.role.id, aliases: [] };
}

export function nameHints(name: string): Hint[] {
  const letters = lettersOf(name);
  return [
    textHint('nameLength', 'Letras no nome', letters.length),
    textHint('firstLetter', 'Primeira letra', letters[0]),
    textHint('lastLetter', 'Última letra', letters.slice(-1)),
  ].filter((hint): hint is Hint => hint !== null);
}

export function abilityTypeHint(ability: Ability): Hint | null {
  return textHint('type', 'Tipo da habilidade', ABILITY_TYPE_LABELS[ability.type]);
}

export function abilitySlotHint(ability: Ability): Hint {
  return { kind: 'slot', label: 'Tecla', value: `Usada na tecla ${ability.slot}`, visual: { type: 'key', key: ability.slot } };
}

export function roleHint(agent: Agent): Hint | null {
  return textHint('role', 'Função do agente', agent.role.name);
}

export function maskedDescription(ability: Ability, agent: Agent): Hint | null {
  const hiddenWords = [...ability.name.split(/[\s/]+/), ...agent.name.split(/[\s/]+/)].filter(
    (word) => word.length >= MIN_MASKED_WORD && !CONNECTORS.has(word.toLowerCase()),
  );
  const masked = hiddenWords.reduce(
    (text, word) => text.replace(new RegExp(`(?<![\\p{L}])${escapeRegExp(word)}(?![\\p{L}])`, 'giu'), MASK),
    ability.description,
  );
  return textHint('description', 'Descrição', summarize(masked));
}

function summarize(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((sentence) => !/^EQUIPE\b/.test(sentence));
  let summary = '';
  for (const sentence of sentences) {
    if (summary.length >= SUMMARY_MIN_LENGTH) break;
    summary = summary ? `${summary} ${sentence}` : sentence;
  }
  return summary.length > SUMMARY_MAX_LENGTH ? `${summary.slice(0, SUMMARY_MAX_LENGTH).trimEnd()}…` : summary;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function indexBy<T extends { readonly id: string }>(records: readonly T[]): ReadonlyMap<string, T> {
  return new Map(records.map((record) => [record.id, record]));
}

export function requireFrom<T>(index: ReadonlyMap<string, T>, id: string, label: string): T {
  const record = index.get(id);
  if (!record) throw new Error(`${label} não encontrado: ${id}`);
  return record;
}

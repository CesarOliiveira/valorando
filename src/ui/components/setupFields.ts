import { DIFFICULTY_LABELS, DIFFICULTY_ORDER } from '../../config/gameConfig';
import type { ChallengeDefinition, ChallengeId, DifficultyId, ModeId } from '../../domain/rules';
import type { PlayerSettings } from '../../infrastructure/repositories';
import type { ModeCatalog } from '../../modes/modeCatalog';
import { escapeHtml, ICONS, requireElement } from '../dom';

interface Choice {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
  readonly meta?: string;
}

function choiceGroup(name: string, legend: string, idPrefix: string, choices: readonly Choice[], selected: string): string {
  const items = choices
    .map(
      (choice) => `
      <label class="choice" for="${idPrefix}-${name}-${choice.id}">
        <input type="radio" id="${idPrefix}-${name}-${choice.id}" name="${name}" value="${choice.id}" ${choice.id === selected ? 'checked' : ''} />
        <span class="choice__body">
          <span class="choice__title">${escapeHtml(choice.label)}${choice.meta ? `<span class="choice__meta">${escapeHtml(choice.meta)}</span>` : ''}</span>
          <span class="choice__summary">${escapeHtml(choice.summary)}</span>
        </span>
      </label>`,
    )
    .join('');
  return `<fieldset class="choices choices--${name}"><legend class="eyebrow">${legend}</legend><div class="choices__grid">${items}</div></fieldset>`;
}

function challengeSize(challenge: ChallengeDefinition): number {
  return Math.max(...challenge.modes.map((mode) => mode.questions.length));
}

function difficultyMeter(level: number): string {
  const bars = [1, 2, 3].map((step) => `<span class="meter__bar${step <= level ? ' is-on' : ''}"></span>`).join('');
  const label = ['', 'Acessível', 'Intermediário', 'Desafiador'][level];
  return `<span class="meter" aria-label="Dificuldade: ${label}">${bars}<span class="meter__label">${label}</span></span>`;
}

function challengeCards(idPrefix: string, catalog: ModeCatalog, selected: ChallengeId): string {
  const cards = catalog.challenges
    .map(
      (challenge) => `
      <label class="challenge" for="${idPrefix}-challenge-${challenge.id}">
        <input type="radio" id="${idPrefix}-challenge-${challenge.id}" name="challenge" value="${challenge.id}" ${challenge.id === selected ? 'checked' : ''} />
        <span class="challenge__body">
          <span class="challenge__icon">${ICONS[challenge.id]}</span>
          <span class="challenge__name">${escapeHtml(challenge.label)}</span>
          <span class="challenge__summary">${escapeHtml(challenge.summary)}</span>
          <span class="challenge__foot">
            <span class="challenge__count">${challengeSize(challenge)} desafios</span>
            ${difficultyMeter(challenge.intrinsicDifficulty)}
          </span>
        </span>
      </label>`,
    )
    .join('');
  return `<fieldset class="challenges"><legend class="sr-only">Desafio</legend>${cards}</fieldset>`;
}

function variantsMarkup(idPrefix: string, challenge: ChallengeDefinition, selected: ModeId): string {
  const choices = challenge.modes.map((mode) => ({ id: mode.id, label: mode.label, summary: mode.summary }));
  const checked = challenge.modes.some((mode) => mode.id === selected) ? selected : challenge.modes[0].id;
  return choiceGroup('mode', 'Variante', idPrefix, choices, checked);
}

function difficultyMarkup(idPrefix: string, selected: DifficultyId): string {
  const choices = DIFFICULTY_ORDER.map((id) => ({
    id,
    label: DIFFICULTY_LABELS[id].label,
    summary: DIFFICULTY_LABELS[id].summary,
    meta: `${DIFFICULTY_LABELS[id].maxAttempts} tent.`,
  }));
  return choiceGroup('difficulty', 'Dificuldade', idPrefix, choices, selected);
}

export function setupFieldsMarkup(idPrefix: string, catalog: ModeCatalog, settings: PlayerSettings): string {
  const challenge = catalog.challengeOf(settings.mode);
  return `
    ${challengeCards(idPrefix, catalog, challenge.id)}
    <div class="setup__options">
      <div data-slot="variants">${variantsMarkup(idPrefix, challenge, settings.mode)}</div>
      ${difficultyMarkup(idPrefix, settings.difficulty)}
    </div>`;
}

export function bindSetupFields(form: HTMLFormElement, idPrefix: string, catalog: ModeCatalog, onChange: () => void): void {
  form.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement;
    if (target.name === 'challenge') {
      const challenge = catalog.challenge(target.value as ChallengeId);
      requireElement<HTMLElement>(form, '[data-slot="variants"]').innerHTML = variantsMarkup(idPrefix, challenge, challenge.modes[0].id);
    }
    onChange();
  });
}

export function readSetup(form: HTMLFormElement, catalog: ModeCatalog, fallback: PlayerSettings): PlayerSettings {
  const data = new FormData(form);
  const mode = data.get('mode');
  const difficulty = data.get('difficulty');
  const knownMode = catalog.challenges.some((challenge) => challenge.modes.some((item) => item.id === mode));
  return {
    mode: knownMode ? (mode as ModeId) : fallback.mode,
    difficulty: (DIFFICULTY_ORDER as readonly unknown[]).includes(difficulty) ? (difficulty as DifficultyId) : fallback.difficulty,
  };
}

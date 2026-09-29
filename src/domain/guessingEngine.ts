import { findAnswer } from './answerValidator';
import { autoHintsUnlocked, planHints, type HintPlan } from './hintManager';
import { computeImageState, pickFocus, type FocusChoice, type ImageVisualState } from './imageReveal';
import type { AnswerOption, Hint, Question } from './question';
import type { DifficultyPreset, ModeDefinition, ScoringRules } from './rules';
import { calculateScore, type ScoreBreakdown } from './scoreCalculator';

export type GameStatus =
  | 'IDLE'
  | 'LOADING'
  | 'ERROR'
  | 'PLAYING'
  | 'GUESSING'
  | 'INCORRECT'
  | 'CORRECT'
  | 'LOST'
  | 'RESULT';

export type GuessOutcome =
  | { readonly kind: 'correct' }
  | { readonly kind: 'incorrect'; readonly answer: AnswerOption; readonly newHint: Hint | null; readonly attemptsLeft: number }
  | { readonly kind: 'lost'; readonly answer: AnswerOption }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'duplicate'; readonly answer: AnswerOption };

export interface GuessRecord {
  readonly answer: AnswerOption;
  readonly correct: boolean;
  readonly partial: boolean;
}

export interface RoundSummary {
  readonly won: boolean;
  readonly question: Question;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly hintsUsed: number;
  readonly elapsedMs: number;
  readonly score: ScoreBreakdown;
  readonly guesses: readonly GuessRecord[];
  readonly difficulty: DifficultyPreset['id'];
  readonly mode: ModeDefinition['id'];
  readonly challenge: ModeDefinition['challenge'];
}

export interface GameSnapshot {
  readonly status: GameStatus;
  readonly image: string | null;
  readonly visual: ImageVisualState;
  readonly attempts: number;
  readonly attemptsLeft: number;
  readonly maxAttempts: number;
  readonly guesses: readonly GuessRecord[];
  readonly pinnedHints: readonly Hint[];
  readonly hints: readonly Hint[];
  readonly hintsRemaining: number;
  readonly summary: RoundSummary | null;
}

export interface GuessingEngineDeps {
  readonly mode: ModeDefinition;
  readonly preset: DifficultyPreset;
  readonly scoring: ScoringRules;
  readonly now?: () => number;
  readonly random?: () => number;
}

type Listener = (snapshot: GameSnapshot) => void;

const GUESSABLE: readonly GameStatus[] = ['PLAYING', 'INCORRECT'];
const EMPTY_PLAN: HintPlan = { pinned: [], deck: [] };

export class GuessingGameEngine {
  #status: GameStatus = 'IDLE';
  #question: Question | null = null;
  #hintPlan: HintPlan = EMPTY_PLAN;
  #manualHints = 0;
  #guesses: GuessRecord[] = [];
  #focus: FocusChoice;
  #startedAt = 0;
  #finishedAt = 0;
  #summary: RoundSummary | null = null;
  readonly #listeners = new Set<Listener>();
  readonly #now: () => number;
  readonly #random: () => number;

  constructor(private readonly deps: GuessingEngineDeps) {
    this.#now = deps.now ?? Date.now;
    this.#random = deps.random ?? Math.random;
    this.#focus = pickFocus(deps.mode.presentation.focus, this.#random);
  }

  get status(): GameStatus {
    return this.#status;
  }

  get questionId(): string | null {
    return this.#question?.id ?? null;
  }

  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  beginLoading(question: Question): void {
    this.#assertStatus(['IDLE', 'ERROR'], 'iniciar o carregamento');
    this.#question = question;
    this.#hintPlan = planHints(question.hints, this.deps.preset.hints);
    this.#focus = pickFocus(this.deps.mode.presentation.focus, this.#random);
    this.#transition('LOADING');
  }

  markReady(): void {
    this.#assertStatus(['LOADING'], 'começar a rodada');
    this.#startedAt = this.#now();
    this.#transition('PLAYING');
  }

  markFailed(): void {
    this.#assertStatus(['LOADING'], 'registrar falha de carregamento');
    this.#transition('ERROR');
  }

  submitGuess(input: string): GuessOutcome {
    this.#assertStatus(GUESSABLE, 'enviar um palpite');
    const guessed = findAnswer(input, this.deps.mode.answers);
    if (!guessed) return { kind: 'invalid' };
    if (this.#guesses.some((record) => record.answer.id === guessed.id)) return { kind: 'duplicate', answer: guessed };

    this.#status = 'GUESSING';
    const target = this.#requireQuestion().answer;
    const correct = guessed.id === target.id;
    const hintsBefore = this.#unlockedHintCount();
    this.#guesses.push({ answer: guessed, correct, partial: !correct && guessed.group !== null && guessed.group === target.group });

    if (correct) return this.#finish(true, { kind: 'correct' });
    if (this.#wrongGuesses() >= this.deps.preset.maxAttempts) return this.#finish(false, { kind: 'lost', answer: guessed });

    const newHint = this.#unlockedHintCount() > hintsBefore ? this.#hintPlan.deck[hintsBefore] : null;
    this.#transition('INCORRECT');
    return { kind: 'incorrect', answer: guessed, newHint, attemptsLeft: this.#attemptsLeft() };
  }

  requestHint(): Hint | null {
    this.#assertStatus(GUESSABLE, 'pedir uma pista');
    const before = this.#unlockedHintCount();
    if (before >= this.#hintPlan.deck.length) return null;
    this.#manualHints += 1;
    this.#emit();
    return this.#hintPlan.deck[before];
  }

  showResult(): void {
    this.#assertStatus(['CORRECT', 'LOST'], 'exibir o resultado');
    this.#transition('RESULT');
  }

  elapsedMs(): number {
    if (!this.#startedAt) return 0;
    return (this.#finishedAt || this.#now()) - this.#startedAt;
  }

  snapshot(): GameSnapshot {
    const unlocked = this.#unlockedHintCount();
    return {
      status: this.#status,
      image: this.#question?.image ?? null,
      visual: computeImageState(
        this.deps.preset,
        this.deps.mode.presentation.treatment,
        this.#wrongGuesses(),
        this.#summary !== null,
        this.#focus,
      ),
      attempts: this.#guesses.length,
      attemptsLeft: this.#attemptsLeft(),
      maxAttempts: this.deps.preset.maxAttempts,
      guesses: [...this.#guesses],
      pinnedHints: this.#hintPlan.pinned,
      hints: this.#hintPlan.deck.slice(0, unlocked),
      hintsRemaining: this.#hintPlan.deck.length - unlocked,
      summary: this.#summary,
    };
  }

  #finish(won: boolean, outcome: GuessOutcome): GuessOutcome {
    this.#finishedAt = this.#now();
    const wrongGuesses = this.#wrongGuesses();
    const hintsUsed = this.#hintsUsed();
    const elapsedMs = this.elapsedMs();
    this.#summary = {
      won,
      question: this.#requireQuestion(),
      attempts: this.#guesses.length,
      maxAttempts: this.deps.preset.maxAttempts,
      hintsUsed,
      elapsedMs,
      guesses: [...this.#guesses],
      difficulty: this.deps.preset.id,
      mode: this.deps.mode.id,
      challenge: this.deps.mode.challenge,
      score: calculateScore(
        {
          won,
          wrongGuesses,
          hintsUsed,
          revealLevel: Math.min(wrongGuesses, this.deps.preset.revealLevels.length - 1),
          elapsedMs,
          multiplier: this.deps.preset.scoreMultiplier,
        },
        this.deps.scoring,
      ),
    };
    this.#transition(won ? 'CORRECT' : 'LOST');
    return outcome;
  }

  #unlockedHintCount(): number {
    const automatic = autoHintsUnlocked(this.deps.preset.hints, this.#wrongGuesses());
    return Math.min(this.#hintPlan.deck.length, automatic + this.#manualHints);
  }

  #hintsUsed(): number {
    const free = Math.min(this.#hintPlan.deck.length, this.deps.preset.hints.initial);
    return this.#unlockedHintCount() - free;
  }

  #wrongGuesses(): number {
    return this.#guesses.filter((record) => !record.correct).length;
  }

  #attemptsLeft(): number {
    return Math.max(0, this.deps.preset.maxAttempts - this.#wrongGuesses());
  }

  #requireQuestion(): Question {
    if (!this.#question) throw new Error('Nenhum desafio foi selecionado para a rodada.');
    return this.#question;
  }

  #assertStatus(allowed: readonly GameStatus[], action: string): void {
    if (!allowed.includes(this.#status)) {
      throw new Error(`Não é possível ${action} no estado ${this.#status}.`);
    }
  }

  #transition(next: GameStatus): void {
    this.#status = next;
    this.#emit();
  }

  #emit(): void {
    const snapshot = this.snapshot();
    this.#listeners.forEach((listener) => listener(snapshot));
  }
}

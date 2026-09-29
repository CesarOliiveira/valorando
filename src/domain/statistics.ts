import type { GuessRecord, RoundSummary } from './guessingEngine';
import type { ChallengeId } from './rules';

export interface PlayerStats {
  readonly played: number;
  readonly wins: number;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly bestScore: number;
  readonly totalWinningAttempts: number;
}

export interface StatsBook {
  readonly overall: PlayerStats;
  readonly byChallenge: Readonly<Partial<Record<ChallengeId, PlayerStats>>>;
}

export interface StatsSummary extends PlayerStats {
  readonly winRate: number;
  readonly averageAttempts: number;
}

export const EMPTY_STATS: PlayerStats = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  bestStreak: 0,
  bestScore: 0,
  totalWinningAttempts: 0,
};

export const EMPTY_BOOK: StatsBook = { overall: EMPTY_STATS, byChallenge: {} };

export function recordRound(stats: PlayerStats, round: RoundSummary): PlayerStats {
  const currentStreak = round.won ? stats.currentStreak + 1 : 0;
  return {
    played: stats.played + 1,
    wins: stats.wins + (round.won ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    bestScore: Math.max(stats.bestScore, round.score.total),
    totalWinningAttempts: stats.totalWinningAttempts + (round.won ? round.attempts : 0),
  };
}

export function recordInBook(book: StatsBook, round: RoundSummary): StatsBook {
  return {
    overall: recordRound(book.overall, round),
    byChallenge: {
      ...book.byChallenge,
      [round.challenge]: recordRound(book.byChallenge[round.challenge] ?? EMPTY_STATS, round),
    },
  };
}

export function summarizeStats(stats: PlayerStats = EMPTY_STATS): StatsSummary {
  return {
    ...stats,
    winRate: stats.played ? stats.wins / stats.played : 0,
    averageAttempts: stats.wins ? stats.totalWinningAttempts / stats.wins : 0,
  };
}

function shareSquare(guess: GuessRecord): string {
  if (guess.correct) return '🟩';
  return guess.partial ? '🟨' : '🟥';
}

export interface ShareContext {
  readonly emoji: string;
  readonly modeLabel: string;
  readonly difficultyLabel: string;
}

export function buildShareText(round: RoundSummary, context: ShareContext): string {
  const squares = round.guesses.map(shareSquare).join(' ');
  const outcome = round.won ? `${round.attempts} tentativa${round.attempts === 1 ? '' : 's'}` : 'Não acertei';
  return [
    'Valorando',
    '',
    `${context.emoji} ${context.modeLabel} · ${context.difficultyLabel}`,
    squares,
    outcome,
    `${round.score.total} pontos`,
  ].join('\n');
}

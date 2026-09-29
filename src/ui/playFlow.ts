import type { DailyChallenge } from '../application/dailyChallenge';
import type { GameController } from '../application/gameController';
import type { DailyStageStatus } from '../domain/dailyRun';
import type { RoundSummary } from '../domain/guessingEngine';
import type { ChallengeId } from '../domain/rules';

export type NextStep =
  | { readonly kind: 'round'; readonly label: string }
  | { readonly kind: 'exit'; readonly label: string; readonly go: () => void };

export interface FlowStage {
  readonly label: string;
  readonly challenge: ChallengeId;
  readonly status: DailyStageStatus;
  readonly current: boolean;
}

export interface FlowProgress {
  readonly title: string;
  readonly stages: readonly FlowStage[];
}

export interface PlayFlow {
  readonly kind: 'free' | 'daily';
  readonly allowsRoundShare: boolean;
  startRound(): Promise<void>;
  onRoundFinished(summary: RoundSummary): void;
  nextStep(): NextStep;
  progress(): FlowProgress | null;
  onLeave(): void;
}

export function createFreePlayFlow(controller: GameController): PlayFlow {
  return {
    kind: 'free',
    allowsRoundShare: true,
    startRound: () => controller.startRound(),
    onRoundFinished: () => undefined,
    nextStep: () => ({ kind: 'round', label: 'Jogar novamente' }),
    progress: () => null,
    onLeave: () => undefined,
  };
}

export function createDailyPlayFlow(daily: DailyChallenge, showSummary: () => void): PlayFlow {
  return {
    kind: 'daily',
    allowsRoundShare: false,
    startRound: () => daily.startCurrentStage(),
    onRoundFinished: (summary) => daily.recordStageResult(summary),
    nextStep() {
      const next = daily.currentStage();
      return next
        ? { kind: 'round', label: `Próxima etapa: ${next.challenge.label}` }
        : { kind: 'exit', label: 'Ver resultado do dia', go: showSummary };
    },
    progress() {
      const current = daily.stages().find((stage) => stage.record.status === 'playing') ?? daily.currentStage();
      return {
        title: `Desafio do dia · Etapa ${(current?.index ?? daily.stages().length - 1) + 1} de ${daily.stages().length}`,
        stages: daily.stages().map((stage) => ({
          label: stage.challenge.label,
          challenge: stage.challenge.id,
          status: stage.record.status,
          current: stage.index === current?.index,
        })),
      };
    },
    onLeave: () => daily.abandonActiveStage(),
  };
}

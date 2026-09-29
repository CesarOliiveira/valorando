import type { GameContent } from '../content/types';
import { assertUniqueAnswers } from '../domain/question';
import type { ChallengeDefinition, ChallengeId, ModeDefinition, ModeId } from '../domain/rules';
import { createAbilityChallenge } from './abilityModes';
import { createAgentChallenge } from './agentModes';
import { createSkinChallenge } from './skinModes';
import { createWeaponChallenge } from './weaponModes';

export interface ModeCatalog {
  readonly challenges: readonly ChallengeDefinition[];
  mode(id: ModeId): ModeDefinition;
  challenge(id: ChallengeId): ChallengeDefinition;
  challengeOf(modeId: ModeId): ChallengeDefinition;
}

export function createModeCatalog(content: GameContent): ModeCatalog {
  const challenges = [
    createAgentChallenge(content),
    createWeaponChallenge(content),
    createSkinChallenge(content),
    createAbilityChallenge(content),
  ];
  const modes = new Map(challenges.flatMap((challenge) => challenge.modes.map((mode) => [mode.id, mode] as const)));
  modes.forEach((mode) => assertUniqueAnswers(mode.answers, mode.label));

  const find = <T>(value: T | undefined, label: string): T => {
    if (value === undefined) throw new Error(`${label} não encontrado.`);
    return value;
  };

  return {
    challenges,
    mode: (id) => find(modes.get(id), `Modo ${id}`),
    challenge: (id) => find(challenges.find((challenge) => challenge.id === id), `Desafio ${id}`),
    challengeOf: (modeId) => find(challenges.find((challenge) => challenge.modes.some((mode) => mode.id === modeId)), `Desafio do modo ${modeId}`),
  };
}

import { difficultiesFor } from '../config/gameConfig';
import type { Ability, Agent, GameContent } from '../content/types';
import { compactHints, customHints, lettersOf, textHint, type AnswerOption, type Question, type ResultDetail } from '../domain/question';
import type { ChallengeDefinition, ModeDefinition } from '../domain/rules';
import {
  abilitySlotHint,
  abilityTypeHint,
  ABILITY_TYPE_LABELS,
  agentAnswer,
  FOCUS,
  indexBy,
  maskedDescription,
  nameHints,
  requireFrom,
  roleHint,
} from './shared';

const PRESENTATION = { treatment: 'progressive-reveal', fit: 'icon', focus: FOCUS.icon } as const;

const AGENT_COPY = {
  title: 'Adivinhe o agente',
  prompt: 'A qual agente pertence essa habilidade?',
  placeholder: 'Digite o nome do agente...',
  answerLabel: 'Agente',
};

function abilityAnswer(ability: Ability): AnswerOption {
  const parts = ability.name.split(/\s*\/\s*/).filter((part) => part && part !== ability.name);
  return { id: ability.id, name: ability.name, icon: null, group: ability.agentId, aliases: parts };
}

function abilityDetails(ability: Ability, agent: Agent): ResultDetail[] {
  return [
    { label: 'Habilidade', value: ability.name },
    { label: 'Agente', value: agent.name },
    { label: 'Função', value: agent.role.name },
    { label: 'Tipo', value: `${ABILITY_TYPE_LABELS[ability.type]} · ${ability.slot}` },
  ];
}

function abilityQuestion(ability: Ability, agent: Agent): Question {
  return {
    id: ability.id,
    answer: abilityAnswer(ability),
    image: ability.icon,
    hints: compactHints([
      roleHint(agent),
      abilityTypeHint(ability),
      abilitySlotHint(ability),
      maskedDescription(ability, agent),
      ...nameHints(ability.name).slice(0, 2),
      textHint('agent', 'Agente', agent.name),
      ...customHints(ability.hints),
    ]),
    details: abilityDetails(ability, agent),
  };
}

function ownerQuestion(ability: Ability, agent: Agent): Question {
  return {
    id: ability.id,
    answer: agentAnswer(agent),
    image: ability.icon,
    hints: compactHints([
      roleHint(agent),
      abilityTypeHint(ability),
      abilitySlotHint(ability),
      maskedDescription(ability, agent),
      textHint('abilityName', 'Nome da habilidade', ability.name),
      textHint('firstLetter', 'Agente começa com', lettersOf(agent.name)[0]),
      ...customHints(ability.hints),
    ]),
    details: abilityDetails(ability, agent),
  };
}

export function createAbilityChallenge(content: GameContent): ChallengeDefinition {
  const agents = indexBy(content.agents);
  const agentOf = (ability: Ability) => requireFrom(agents, ability.agentId, 'Agente');
  const agentAnswers = content.agents.map(agentAnswer);
  const ultimates = content.abilities.filter((ability) => ability.type === 'ultimate');

  const modes: ModeDefinition[] = [
    {
      id: 'ability',
      challenge: 'abilities',
      label: 'Nome da habilidade',
      summary: 'Veja o ícone e diga qual habilidade é.',
      copy: {
        title: 'Adivinhe a habilidade',
        prompt: 'Qual habilidade é essa?',
        placeholder: 'Digite o nome da habilidade...',
        answerLabel: 'Habilidade',
      },
      presentation: PRESENTATION,
      difficulties: difficultiesFor('ability'),
      answerType: 'ability',
      questions: content.abilities.map((ability) => abilityQuestion(ability, agentOf(ability))),
      answers: content.abilities.map(abilityAnswer),
    },
    {
      id: 'ability-agent',
      challenge: 'abilities',
      label: 'Dono da habilidade',
      summary: 'Veja o ícone e diga qual agente usa essa habilidade.',
      copy: AGENT_COPY,
      presentation: PRESENTATION,
      difficulties: difficultiesFor('ability-agent'),
      answerType: 'agent',
      questions: content.abilities.map((ability) => ownerQuestion(ability, agentOf(ability))),
      answers: agentAnswers,
    },
    {
      id: 'ultimate',
      challenge: 'abilities',
      label: 'Ultimate',
      summary: 'Só ultimates. Descubra de qual agente é.',
      copy: { ...AGENT_COPY, title: 'Adivinhe pela ultimate', prompt: 'De qual agente é essa ultimate?' },
      presentation: PRESENTATION,
      difficulties: difficultiesFor('ultimate'),
      answerType: 'agent',
      questions: ultimates.map((ability) => ownerQuestion(ability, agentOf(ability))),
      answers: agentAnswers,
    },
  ];

  return {
    id: 'abilities',
    label: 'Habilidades',
    summary: 'Descubra a habilidade ou o agente pelo ícone.',
    shareLabel: 'Habilidade',
    shareEmoji: '⚡',
    intrinsicDifficulty: 2,
    modes,
  };
}

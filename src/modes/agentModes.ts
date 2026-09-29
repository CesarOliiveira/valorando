import { difficultiesFor } from '../config/gameConfig';
import type { Ability, Agent, GameContent } from '../content/types';
import { compactHints, customHints, textHint, type Hint, type Question } from '../domain/question';
import type { ChallengeDefinition, ModeDefinition } from '../domain/rules';
import { agentAnswer, FOCUS, nameHints } from './shared';

const COPY = {
  title: 'Adivinhe o agente',
  prompt: 'Qual agente você acha que é?',
  placeholder: 'Digite o nome do agente...',
  answerLabel: 'Agente',
};

function abilityIconHint(kind: 'ability' | 'ultimate', ability: Ability | undefined): Hint | null {
  if (!ability) return null;
  return {
    kind,
    label: kind === 'ultimate' ? 'Ultimate' : 'Habilidade',
    value: ability.name,
    visual: { type: 'icon', icon: ability.icon, key: ability.slot },
  };
}

function agentQuestion(agent: Agent, abilities: readonly Ability[]): Question {
  const own = abilities.filter((ability) => ability.agentId === agent.id);
  return {
    id: agent.id,
    answer: agentAnswer(agent),
    image: agent.image,
    hints: compactHints([
      textHint('role', 'Função', agent.role.name),
      textHint('releaseYear', 'Lançamento', agent.releaseDate?.slice(0, 4)),
      textHint('country', 'Origem', agent.country),
      { kind: 'color', label: 'Cor predominante', value: agent.color.toUpperCase(), visual: { type: 'swatch', color: agent.color } },
      abilityIconHint('ability', own.find((ability) => ability.type !== 'ultimate')),
      abilityIconHint('ultimate', own.find((ability) => ability.type === 'ultimate')),
      ...nameHints(agent.name),
      ...customHints(agent.hints),
    ]),
    details: compactHints([textHint('role', 'Função', agent.role.name), textHint('country', 'Origem', agent.country)]),
  };
}

export function createAgentChallenge(content: GameContent): ChallengeDefinition {
  const questions = content.agents.map((agent) => agentQuestion(agent, content.abilities));
  const answers = content.agents.map(agentAnswer);
  const base = { challenge: 'agents', copy: COPY, answerType: 'agent', questions, answers } as const;
  const modes: ModeDefinition[] = [
    {
      ...base,
      id: 'agent-classic',
      label: 'Clássico',
      summary: 'A imagem começa borrada e escura e se revela a cada erro.',
      presentation: { treatment: 'progressive-reveal', fit: 'portrait', focus: FOCUS.portrait },
      difficulties: difficultiesFor('agent-classic'),
    },
    {
      ...base,
      id: 'agent-silhouette',
      label: 'Silhueta',
      summary: 'Só o contorno do agente. Identifique pela forma.',
      presentation: { treatment: 'silhouette', fit: 'portrait', focus: FOCUS.portrait },
      difficulties: difficultiesFor('agent-silhouette'),
    },
  ];
  return {
    id: 'agents',
    label: 'Agentes',
    summary: 'Descubra quem é o agente pela imagem.',
    shareLabel: 'Agente',
    shareEmoji: '👤',
    intrinsicDifficulty: 1,
    modes,
  };
}

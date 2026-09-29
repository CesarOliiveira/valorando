import { difficultiesFor } from '../config/gameConfig';
import type { GameContent, Weapon } from '../content/types';
import { compactHints, customHints, textHint, type AnswerOption, type Question } from '../domain/question';
import type { ChallengeDefinition } from '../domain/rules';
import { FOCUS, nameHints } from './shared';

const numberFormat = new Intl.NumberFormat('pt-BR');

export function formatPrice(price: number | null): string {
  if (price === null) return 'Não é vendida';
  if (price === 0) return 'Gratuita';
  return `${numberFormat.format(price)} créditos`;
}

export function weaponAnswer(weapon: Weapon): AnswerOption {
  return { id: weapon.id, name: weapon.name, icon: null, group: weapon.category.id, aliases: weapon.aliases };
}

function weaponQuestion(weapon: Weapon): Question {
  return {
    id: weapon.id,
    answer: weaponAnswer(weapon),
    image: weapon.image,
    hints: compactHints([
      textHint('category', 'Categoria', weapon.category.name),
      textHint('price', 'Preço', formatPrice(weapon.price)),
      textHint('fireMode', 'Modo de disparo', weapon.fireMode),
      textHint('ammo', 'Capacidade', weapon.ammo === null ? null : `${weapon.ammo} munições`),
      textHint('wallPenetration', 'Penetração em paredes', weapon.wallPenetration),
      textHint('fireRate', 'Cadência', weapon.fireRate === null ? null : `${numberFormat.format(weapon.fireRate)} disparos/s`),
      textHint('usage', 'Uso', weapon.usage),
      ...nameHints(weapon.name),
      ...customHints(weapon.hints),
    ]),
    details: compactHints([textHint('category', 'Categoria', weapon.category.name), textHint('price', 'Preço', formatPrice(weapon.price))]),
  };
}

export function createWeaponChallenge(content: GameContent): ChallengeDefinition {
  return {
    id: 'weapons',
    label: 'Armas',
    summary: 'Descubra a arma pela silhueta borrada.',
    shareLabel: 'Arma',
    shareEmoji: '🔫',
    intrinsicDifficulty: 2,
    modes: [
      {
        id: 'weapon',
        challenge: 'weapons',
        label: 'Arma padrão',
        summary: 'O modelo padrão da arma, borrado a cada rodada.',
        copy: {
          title: 'Adivinhe a arma',
          prompt: 'Qual é essa arma?',
          placeholder: 'Digite o nome da arma...',
          answerLabel: 'Arma',
        },
        presentation: { treatment: 'progressive-reveal', fit: 'wide', focus: FOCUS.wide },
        difficulties: difficultiesFor('weapon'),
        answerType: 'weapon',
        questions: content.weapons.map(weaponQuestion),
        answers: content.weapons.map(weaponAnswer),
      },
    ],
  };
}

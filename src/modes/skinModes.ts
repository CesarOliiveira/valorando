import { difficultiesFor } from '../config/gameConfig';
import type { GameContent, Skin, Weapon } from '../content/types';
import { compactHints, customHints, lettersOf, textHint, type AnswerOption, type Hint, type Question } from '../domain/question';
import type { ChallengeDefinition, ModeDefinition } from '../domain/rules';
import { FOCUS, indexBy, requireFrom } from './shared';

type AnswerFor = (skin: Skin) => AnswerOption;

const skinAnswer: AnswerFor = (skin) => ({ id: skin.id, name: skin.name, icon: null, group: skin.weaponId, aliases: [] });

const collectionAnswer: AnswerFor = (skin) => ({
  id: skin.collection.id,
  name: skin.collection.name,
  icon: null,
  group: null,
  aliases: [],
});

function withoutWeaponName(skin: Skin, weapon: Weapon): string {
  const pattern = new RegExp(`(^|\\s)${weapon.name}(?=\\s|$)`, 'iu');
  return skin.name.replace(pattern, ' ').trim() || skin.name;
}

function skinTraitHints(skin: Skin): Hint[] {
  return compactHints([
    textHint('edition', 'Edição', skin.edition.replace(/^Edição\s+/i, '')),
    textHint('effects', 'Efeitos', skin.hasEffects ? 'Possui efeitos visuais especiais' : 'Sem efeitos visuais especiais'),
    textHint(
      'variants',
      'Variantes',
      skin.variants.length ? `Possui ${skin.variants.length} variante(s) de aparência` : 'Sem variantes de aparência',
    ),
  ]);
}

function skinQuestion(skin: Skin, weapon: Weapon): Question {
  const displayName = withoutWeaponName(skin, weapon);
  return {
    id: skin.id,
    answer: skinAnswer(skin),
    image: skin.image,
    hints: compactHints([
      textHint('weapon', 'Arma', weapon.name),
      ...skinTraitHints(skin),
      textHint('firstLetter', 'Nome (sem a arma) começa com', lettersOf(displayName)[0]),
      textHint('collection', 'Coleção', skin.collection.name),
      ...customHints(skin.hints),
    ]),
    details: [
      { label: 'Arma', value: weapon.name },
      { label: 'Coleção', value: skin.collection.name },
      { label: 'Edição', value: skin.edition },
    ],
  };
}

function collectionQuestion(skin: Skin, weapon: Weapon, collectionSize: number): Question {
  return {
    id: skin.id,
    answer: collectionAnswer(skin),
    image: skin.image,
    hints: compactHints([
      textHint('weapon', 'Arma', weapon.name),
      ...skinTraitHints(skin),
      textHint('collectionSize', 'Tamanho da coleção', `${collectionSize} skins neste jogo`),
      textHint('nameLength', 'Letras no nome da coleção', lettersOf(skin.collection.name).length),
      textHint('firstLetter', 'Coleção começa com', lettersOf(skin.collection.name)[0]),
      ...customHints(skin.hints),
    ]),
    details: [
      { label: 'Skin', value: skin.name },
      { label: 'Arma', value: weapon.name },
      { label: 'Edição', value: skin.edition },
    ],
  };
}

function uniqueAnswers(skins: readonly Skin[], answerFor: AnswerFor): AnswerOption[] {
  const byId = new Map(skins.map((skin) => [answerFor(skin).id, answerFor(skin)]));
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function createSkinChallenge(content: GameContent): ChallengeDefinition {
  const weapons = indexBy(content.weapons);
  const weaponOf = (skin: Skin) => requireFrom(weapons, skin.weaponId, 'Arma');
  const collectionSizes = new Map<string, number>();
  content.skins.forEach((skin) => collectionSizes.set(skin.collection.id, (collectionSizes.get(skin.collection.id) ?? 0) + 1));
  const presentation = { treatment: 'progressive-reveal', fit: 'wide', focus: FOCUS.wide } as const;

  const modes: ModeDefinition[] = [
    {
      id: 'skin',
      challenge: 'skins',
      label: 'Nome da skin',
      summary: 'Descubra a skin exata a partir da imagem.',
      copy: { title: 'Descubra a skin', prompt: 'Qual é essa skin?', placeholder: 'Digite o nome da skin...', answerLabel: 'Skin' },
      presentation,
      difficulties: difficultiesFor('skin'),
      answerType: 'skin',
      questions: content.skins.map((skin) => skinQuestion(skin, weaponOf(skin))),
      answers: uniqueAnswers(content.skins, skinAnswer),
    },
    {
      id: 'skin-collection',
      challenge: 'skins',
      label: 'Coleção',
      summary: 'Diga a qual coleção a skin pertence.',
      copy: {
        title: 'Descubra a coleção',
        prompt: 'De qual coleção é essa skin?',
        placeholder: 'Digite o nome da coleção...',
        answerLabel: 'Coleção',
      },
      presentation,
      difficulties: difficultiesFor('skin-collection'),
      answerType: 'collection',
      questions: content.skins.map((skin) =>
        collectionQuestion(skin, weaponOf(skin), collectionSizes.get(skin.collection.id) ?? 1),
      ),
      answers: uniqueAnswers(content.skins, collectionAnswer),
    },
  ];

  return {
    id: 'skins',
    label: 'Skins',
    summary: 'Identifique a skin ou a coleção de uma arma.',
    shareLabel: 'Skin',
    shareEmoji: '🎨',
    intrinsicDifficulty: 3,
    modes,
  };
}

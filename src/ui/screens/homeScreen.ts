import type { DailyChallenge } from '../../application/dailyChallenge';
import type { GameController } from '../../application/gameController';
import { dailyCardMarkup } from '../components/dailyCard';
import { createFragment, formatPercent, requireElement } from '../dom';
import { bindSetupFields, readSetup, setupFieldsMarkup } from '../components/setupFields';

export interface HomeScreenDeps {
  readonly controller: GameController;
  readonly daily: DailyChallenge;
  readonly onPlay: () => void;
}

const STEPS = [
  ['Observe a imagem', 'Ela começa borrada, escura e quase toda escondida.'],
  ['Digite seu palpite', 'Só vale resposta que existe na lista.'],
  ['Use as pistas', 'Cada erro revela mais da imagem e libera uma pista.'],
  ['Acerte rápido', 'Menos tentativas, pistas e tempo valem mais pontos.'],
] as const;

export function createHomeScreen({ controller, daily, onPlay }: HomeScreenDeps): HTMLElement {
  const stats = controller.overallStats();
  const statItems: [string, string][] = [
    ['Melhor pontuação', String(stats.bestScore)],
    ['Sequência atual', String(stats.currentStreak)],
    ['Melhor sequência', String(stats.bestStreak)],
    ['Partidas jogadas', String(stats.played)],
    ['Taxa de acerto', stats.played ? formatPercent(stats.winRate) : '—'],
  ];

  const fragment = createFragment(`
    <section class="home" aria-labelledby="home-title">
      <header class="home__head">
        <p class="eyebrow">Jogar</p>
        <h1 class="home__title" id="home-title">Escolha seu desafio</h1>
      </header>
      ${dailyCardMarkup(daily)}
      <h2 class="eyebrow home__free-title">Partida livre</h2>
      <form class="home__setup" id="home-setup">
        ${setupFieldsMarkup('home', controller.catalog, controller.settings)}
        <button type="submit" class="btn btn--primary btn--xl" id="play-button">Jogar agora</button>
      </form>
      <ol class="steps" aria-label="Como jogar">
        ${STEPS.map(([title, text]) => `<li class="steps__item"><strong>${title}</strong><span>${text}</span></li>`).join('')}
      </ol>
      <dl class="stat-strip" aria-label="Seu desempenho geral">
        ${statItems.map(([label, value]) => `<div class="stat-strip__item"><dt>${label}</dt><dd>${value}</dd></div>`).join('')}
      </dl>
    </section>`);

  const element = requireElement<HTMLElement>(fragment, '.home');
  const form = requireElement<HTMLFormElement>(element, '#home-setup');
  const save = () => controller.updateSettings(readSetup(form, controller.catalog, controller.settings));
  bindSetupFields(form, 'home', controller.catalog, save);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    save();
    onPlay();
  });
  return element;
}

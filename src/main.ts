import './styles/main.css';
import { DailyChallenge } from './application/dailyChallenge';
import { GameController } from './application/gameController';
import { DAILY_CHALLENGE, SCORING, SELECTION, THEME } from './config/gameConfig';
import { loadGameContent } from './content/gameContent';
import { assetUrl } from './infrastructure/assets';
import { preloadImage } from './infrastructure/imagePreloader';
import { createLocalStore } from './infrastructure/localStore';
import { createRepositories } from './infrastructure/repositories';
import { createModeCatalog } from './modes/modeCatalog';
import { mountApp } from './ui/app';
import { requireElement } from './ui/dom';

document.documentElement.style.setProperty('--accent', THEME.accent);

const catalog = createModeCatalog(loadGameContent());
const repositories = createRepositories(createLocalStore());

const controller = new GameController({
  catalog,
  scoring: SCORING,
  selection: SELECTION,
  repositories,
  assetUrl,
  preload: preloadImage,
});

const daily = new DailyChallenge({
  controller,
  catalog,
  modes: DAILY_CHALLENGE.modes,
  difficulty: DAILY_CHALLENGE.difficulty,
  repository: repositories.daily,
});

mountApp(requireElement<HTMLElement>(document, '#app'), {
  controller,
  daily,
  assetUrl,
  hintPenalty: SCORING.hintPenalty,
  successColors: THEME.confetti,
});

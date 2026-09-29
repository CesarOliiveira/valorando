import type { DailyChallenge } from '../application/dailyChallenge';
import type { GameController } from '../application/gameController';
import { createFragment, escapeHtml, ICONS, requireElement } from './dom';
import { startCountdowns } from './components/dailyCard';
import { createSettingsDialog, createStatsDialog } from './components/dialogs';
import { createDailyPlayFlow, createFreePlayFlow, type PlayFlow } from './playFlow';
import { createDailySummaryScreen } from './screens/dailySummaryScreen';
import { createGameScreen, type GameScreen } from './screens/gameScreen';
import { createHomeScreen } from './screens/homeScreen';

export interface AppDeps {
  readonly controller: GameController;
  readonly daily: DailyChallenge;
  readonly assetUrl: (path: string) => string;
  readonly hintPenalty: number;
  readonly successColors: readonly string[];
}

const SHELL = `
  <a class="skip-link" href="#main">Pular para o jogo</a>
  <header class="topbar">
    <button type="button" class="brand" data-action="home" aria-label="Valorando, voltar ao menu">
      <span class="brand__mark" aria-hidden="true"></span>
      <span class="brand__word">Valorando</span>
    </button>
    <span class="topbar__mode" data-ref="mode" hidden></span>
    <div class="topbar__actions">
      <span class="streak" data-ref="streak"></span>
      <button type="button" class="icon-btn" data-action="stats" aria-label="Estatísticas">${ICONS.chart}</button>
      <button type="button" class="icon-btn" data-action="settings" aria-label="Configurações">${ICONS.sliders}</button>
    </div>
  </header>
  <main id="main" class="main" tabindex="-1"></main>`;

export function mountApp(root: HTMLElement, deps: AppDeps): void {
  const { controller, daily } = deps;
  root.append(createFragment(SHELL));
  const main = requireElement<HTMLElement>(root, '#main');
  const streak = requireElement<HTMLElement>(root, '[data-ref="streak"]');
  const modeChip = requireElement<HTMLElement>(root, '[data-ref="mode"]');
  let gameScreen: GameScreen | null = null;
  let activeFlow: PlayFlow | null = null;
  let stopCountdowns: (() => void) | null = null;

  const statsDialog = createStatsDialog(controller);
  const settingsDialog = createSettingsDialog(controller, () => {
    if (!gameScreen) showHome();
  });

  function refreshStreak(): void {
    const { currentStreak } = controller.overallStats();
    streak.innerHTML = `${ICONS.flame}<span>Sequência</span><strong>${currentStreak}</strong>`;
    streak.classList.toggle('is-hot', currentStreak > 0);
    streak.setAttribute('aria-label', `Sequência atual: ${currentStreak}`);
  }

  function showModeChip(label: string | null, icon: string): void {
    modeChip.hidden = label === null;
    if (label !== null) modeChip.innerHTML = `${icon}<span>${escapeHtml(label)}</span>`;
  }

  function clearScreen(): void {
    activeFlow?.onLeave();
    activeFlow = null;
    gameScreen?.destroy();
    gameScreen = null;
    stopCountdowns?.();
    stopCountdowns = null;
    main.replaceChildren();
  }

  function mount(element: HTMLElement): void {
    main.append(element);
    stopCountdowns = startCountdowns(main, () => daily.msUntilNextDay(), () => {
      daily.refresh();
      if (!gameScreen) showHome();
    });
  }

  function showHome(): void {
    clearScreen();
    showModeChip(null, '');
    mount(createHomeScreen({ controller, daily, onPlay: showFreeGame }));
    refreshStreak();
  }

  function showGame(flow: PlayFlow): void {
    clearScreen();
    activeFlow = flow;
    gameScreen = createGameScreen({
      controller,
      flow,
      assetUrl: deps.assetUrl,
      hintPenalty: deps.hintPenalty,
      successColors: deps.successColors,
      onRoundFinished: refreshStreak,
      onExit: showHome,
    });
    mount(gameScreen.element);
    gameScreen.start();
  }

  function showFreeGame(): void {
    const challenge = controller.catalog.challengeOf(controller.settings.mode);
    showModeChip(challenge.label, ICONS[challenge.id]);
    showGame(createFreePlayFlow(controller));
  }

  function showDailyGame(): void {
    if (daily.status() === 'complete') {
      showDailySummary();
      return;
    }
    showModeChip('Desafio do dia', ICONS.calendar);
    showGame(createDailyPlayFlow(daily, showDailySummary));
  }

  function showDailySummary(): void {
    clearScreen();
    showModeChip('Desafio do dia', ICONS.calendar);
    mount(createDailySummaryScreen({ daily, onExit: showHome }));
  }

  root.addEventListener('click', (event) => {
    const action = (event.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'home') showHome();
    if (action === 'stats') statsDialog.open();
    if (action === 'settings') settingsDialog.open();
    if (action === 'daily-play') showDailyGame();
    if (action === 'daily-summary') showDailySummary();
  });

  showHome();
}

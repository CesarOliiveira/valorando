import type { GameController } from '../../application/gameController';
import { searchAnswers } from '../../domain/answerValidator';
import type { GameSnapshot, GuessOutcome, RoundSummary } from '../../domain/guessingEngine';
import type { ImageVisualState } from '../../domain/imageReveal';
import type { Hint } from '../../domain/question';
import { buildShareText } from '../../domain/statistics';
import { createAnswerCombobox } from '../components/answerCombobox';
import { burstConfetti } from '../components/confetti';
import { createPixelCanvas } from '../components/pixelCanvas';
import type { FlowProgress, PlayFlow } from '../playFlow';
import {
  animateNumber,
  createFragment,
  escapeHtml,
  formatDuration,
  formatSeconds,
  ICONS,
  prefersReducedMotion,
  replayAnimation,
  requireElement,
} from '../dom';

export interface GameScreenDeps {
  readonly controller: GameController;
  readonly flow: PlayFlow;
  readonly assetUrl: (path: string) => string;
  readonly hintPenalty: number;
  readonly successColors: readonly string[];
  readonly onRoundFinished: () => void;
  readonly onExit: () => void;
}

export interface GameScreen {
  readonly element: HTMLElement;
  start(): void;
  destroy(): void;
}

type FeedbackTone = 'error' | 'success' | 'info' | 'warning';

const RESULT_DELAY_MS = 650;
const TIMER_INTERVAL_MS = 500;
const FEEDBACK_ICONS: Readonly<Record<FeedbackTone, string>> = {
  error: ICONS.cross,
  success: ICONS.check,
  info: ICONS.search,
  warning: ICONS.warning,
};

const MARKUP = `
  <section class="game" aria-labelledby="game-title">
    <figure class="stage stage--game" data-ref="stage" data-status="LOADING">
      <div class="stage__frame" data-ref="frame">
        <canvas class="stage__img" data-ref="image" role="img" aria-label=""></canvas>
        <span class="stage__reticle" aria-hidden="true"></span>
      </div>
      <div class="stage__hud" aria-hidden="true">
        <span class="hud-tag" data-ref="mode-tag"></span>
        <span class="hud-tag hud-tag--timer" data-ref="timer">00:00</span>
      </div>
      <div class="stage__overlay" data-ref="overlay"></div>
      <figcaption class="stage__plate" data-ref="plate"></figcaption>
      <div class="stage__meter" aria-hidden="true">
        <span>Revelado</span>
        <span class="stage__meter-bar"><span data-ref="meter-fill"></span></span>
        <span data-ref="meter-value">0%</span>
      </div>
    </figure>

    <div class="game__panel">
      <nav class="daily-track" data-ref="track" aria-label="Etapas do desafio do dia" hidden></nav>
      <div class="guess" data-ref="guess-area">
        <h1 class="eyebrow" id="game-title" data-ref="title"></h1>
        <label for="guess-input" class="guess__label" data-ref="prompt"></label>
        <div class="combo" data-ref="combo">
          <span class="combo__icon" aria-hidden="true">${ICONS.search}</span>
          <input id="guess-input" class="combo__input" type="text" role="combobox" aria-autocomplete="list"
            aria-controls="guess-options" aria-expanded="false" aria-describedby="guess-feedback"
            autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" />
          <ul id="guess-options" class="combo__list" role="listbox" aria-label="Respostas possíveis" hidden></ul>
        </div>
        <p class="feedback" id="guess-feedback" data-ref="feedback" role="status" aria-live="polite"></p>
      </div>

      <div class="result" data-ref="result" hidden></div>

      <div class="attempts">
        <div class="attempts__head">
          <span class="eyebrow">Tentativas</span>
          <span class="attempts__count" data-ref="attempts-count">0/0</span>
        </div>
        <ol class="attempts__pips" data-ref="pips" aria-hidden="true"></ol>
      </div>

      <section class="hints" aria-labelledby="hints-title">
        <header class="hints__head">
          <h2 class="eyebrow" id="hints-title">Pistas</h2>
          <button type="button" class="btn btn--small" data-ref="hint-button">
            ${ICONS.search}<span>Revelar pista</span><span class="btn__cost" data-ref="hint-cost"></span>
          </button>
        </header>
        <ol class="hints__list" data-ref="hints"></ol>
      </section>

      <section class="guesses" aria-labelledby="guesses-title" data-ref="guesses-section" hidden>
        <h2 class="eyebrow" id="guesses-title">Palpites</h2>
        <ul class="guesses__list" data-ref="guesses"></ul>
      </section>
    </div>
  </section>`;

export function createGameScreen(deps: GameScreenDeps): GameScreen {
  const { controller } = deps;
  const element = requireElement<HTMLElement>(createFragment(MARKUP), '.game');
  const ref = <T extends HTMLElement>(name: string) => requireElement<T>(element, `[data-ref="${name}"]`);

  const stage = ref<HTMLElement>('stage');
  const frame = ref<HTMLElement>('frame');
  const image = ref<HTMLCanvasElement>('image');
  const pixelCanvas = createPixelCanvas(image);
  const overlay = ref<HTMLElement>('overlay');
  const plate = ref<HTMLElement>('plate');
  const timer = ref<HTMLElement>('timer');
  const combo = ref<HTMLElement>('combo');
  const input = requireElement<HTMLInputElement>(element, '#guess-input');
  const feedback = ref<HTMLElement>('feedback');
  const guessArea = ref<HTMLElement>('guess-area');
  const result = ref<HTMLElement>('result');
  const hintButton = ref<HTMLButtonElement>('hint-button');
  const hintsList = ref<HTMLOListElement>('hints');

  let renderedHints = 0;
  let renderedStatus: GameSnapshot['status'] | null = null;
  let resultHandle = 0;

  const iconUrl = (path: string | null) => (path ? deps.assetUrl(path) : null);
  const guessedIds = () => new Set((controller.snapshot()?.guesses ?? []).map((record) => record.answer.id));

  const combobox = createAnswerCombobox({
    input,
    listbox: requireElement<HTMLUListElement>(element, '#guess-options'),
    search: (query) => searchAnswers(query, controller.mode.answers, guessedIds()),
    iconUrl: (option) => iconUrl(option.icon),
    onSelect: (option) => handleOutcome(controller.guess(option.name)),
    onReject: (query) => {
      const message = query.trim() ? `"${query.trim()}" não está na lista.` : 'Digite um nome e escolha uma resposta da lista.';
      showFeedback('error', message);
      shakeInput();
    },
  });

  hintButton.addEventListener('click', () => {
    const hint = controller.requestHint();
    if (hint) showFeedback('info', `Nova pista: ${hint.label} — ${hint.value}.`);
    input.focus();
  });

  const unsubscribe = controller.onSnapshot(render);

  function handleOutcome(outcome: GuessOutcome): void {
    switch (outcome.kind) {
      case 'invalid':
        showFeedback('error', 'Escolha uma resposta da lista.');
        shakeInput();
        return;
      case 'duplicate':
        showFeedback('error', `Você já tentou ${outcome.answer.name}.`);
        shakeInput();
        return;
      case 'incorrect': {
        combobox.clear();
        const hintText = outcome.newHint ? ` Nova pista: ${outcome.newHint.label} — ${outcome.newHint.value}.` : '';
        const lastChance = outcome.attemptsLeft === 1;
        showFeedback(lastChance ? 'warning' : 'error', `Não foi dessa vez: ${outcome.answer.name}.${hintText}${lastChance ? ' Última tentativa!' : ''}`);
        shakeInput();
        return;
      }
      case 'correct':
        combobox.clear();
        showFeedback('success', 'Você acertou!');
        replayAnimation(frame, 'is-celebrating');
        burstConfetti(stage, deps.successColors);
        scheduleResult();
        return;
      case 'lost':
        combobox.clear();
        showFeedback('error', `Não foi dessa vez: ${outcome.answer.name}. Você não acertou.`);
        shakeInput();
        scheduleResult();
        return;
    }
  }

  function scheduleResult(): void {
    const summary = controller.snapshot()?.summary;
    if (summary) deps.flow.onRoundFinished(summary);
    deps.onRoundFinished();
    resultHandle = window.setTimeout(() => controller.showResult(), prefersReducedMotion() ? 0 : RESULT_DELAY_MS);
  }

  function showFeedback(tone: FeedbackTone, message: string): void {
    feedback.dataset.tone = tone;
    feedback.innerHTML = `<span class="feedback__icon">${FEEDBACK_ICONS[tone]}</span><span>${escapeHtml(message)}</span>`;
    replayAnimation(feedback, 'is-fresh');
  }

  function shakeInput(): void {
    replayAnimation(combo, 'is-shaking');
  }

  function render(snapshot: GameSnapshot): void {
    stage.dataset.status = snapshot.status;
    stage.dataset.fit = controller.mode.presentation.fit;
    stage.dataset.treatment = controller.mode.presentation.treatment;
    if (snapshot.summary) stage.dataset.outcome = snapshot.summary.won ? 'won' : 'lost';
    else delete stage.dataset.outcome;
    applyVisual(snapshot.visual);
    renderImage(snapshot);
    renderOverlay(snapshot);
    renderAttempts(snapshot);
    renderHints(snapshot);
    renderGuesses(snapshot);
    renderControls(snapshot);
    renderTrack(deps.flow.progress());
    if (snapshot.status === 'RESULT' && renderedStatus !== 'RESULT' && snapshot.summary) renderResult(snapshot.summary);
    renderedStatus = snapshot.status;
  }

  function renderTrack(progress: FlowProgress | null): void {
    const track = ref('track');
    track.hidden = progress === null;
    if (!progress) return;
    const stages = progress.stages
      .map(
        (stage) => `
        <li class="daily-track__stage daily-track__stage--${stage.status}${stage.current ? ' is-current' : ''}"${stage.current ? ' aria-current="step"' : ''}>
          <span class="daily-track__icon">${ICONS[stage.challenge]}</span>
          <span class="daily-track__label">${escapeHtml(stage.label)}</span>
        </li>`,
      )
      .join('');
    track.innerHTML = `<p class="eyebrow daily-track__title">${escapeHtml(progress.title)}</p><ol class="daily-track__stages">${stages}</ol>`;
  }

  function applyVisual(visual: ImageVisualState): void {
    pixelCanvas.setFit(controller.mode.presentation.fit);
    pixelCanvas.setPixels(visual.pixels);
    stage.dataset.anchor = visual.anchor;
    stage.style.setProperty('--blur', `${visual.blur}px`);
    stage.style.setProperty('--reveal', `${visual.reveal}%`);
    stage.style.setProperty('--bright', String(visual.brightness));
    stage.style.setProperty('--contrast', String(visual.contrast));
    stage.style.setProperty('--saturation', String(visual.saturation));
    stage.style.setProperty('--silhouette', String(visual.silhouette));
    stage.style.setProperty('--fx', `${visual.focus.x}%`);
    stage.style.setProperty('--fy', `${visual.focus.y}%`);
    ref('meter-fill').style.width = `${visual.reveal}%`;
    ref('meter-value').textContent = `${visual.reveal}%`;
  }

  function renderImage(snapshot: GameSnapshot): void {
    const { copy } = controller.mode;
    const imageReady = snapshot.status !== 'LOADING' && snapshot.status !== 'ERROR';
    if (snapshot.image && imageReady && image.dataset.src !== snapshot.image) {
      image.dataset.src = snapshot.image;
      pixelCanvas.show(deps.assetUrl(snapshot.image)).catch((error: unknown) => {
        console.error(error);
        showFeedback('error', 'Não foi possível exibir a imagem. Tente a próxima rodada.');
      });
    }
    const answer = snapshot.summary?.question.answer;
    image.setAttribute(
      'aria-label',
      answer ? `Imagem revelada por completo. Resposta: ${answer.name}.` : `Imagem pixelada e parcialmente oculta. ${copy.prompt}`,
    );
    plate.innerHTML = answer
      ? `<span class="stage__plate-role">${escapeHtml(copy.answerLabel)}</span><span class="stage__plate-name">${escapeHtml(answer.name)}</span>`
      : '';
    ref('title').textContent = copy.title;
    ref('prompt').textContent = copy.prompt;
    combobox.setPlaceholder(copy.placeholder);
    ref('mode-tag').textContent = `${controller.mode.label} · ${controller.preset.label}`;
  }

  function renderOverlay(snapshot: GameSnapshot): void {
    if (snapshot.status === 'LOADING') {
      overlay.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Carregando desafio…</span>';
    } else if (snapshot.status === 'ERROR') {
      overlay.innerHTML = `
        <p>Não foi possível carregar a imagem deste desafio. Verifique sua conexão e tente outro.</p>
        <button type="button" class="btn btn--primary" data-action="retry">Tentar outro desafio</button>`;
      requireElement<HTMLButtonElement>(overlay, '[data-action="retry"]').addEventListener('click', () => {
        void controller.retry();
      });
    } else {
      overlay.innerHTML = '';
    }
  }

  function renderAttempts(snapshot: GameSnapshot): void {
    ref('attempts-count').textContent = `${snapshot.attempts}/${snapshot.maxAttempts}`;
    const pips = Array.from({ length: snapshot.maxAttempts }, (_, index) => {
      const record = snapshot.guesses[index];
      const state = !record ? 'empty' : record.correct ? 'hit' : 'miss';
      return `<li class="pip pip--${state}">${state === 'hit' ? ICONS.check : state === 'miss' ? ICONS.cross : ''}</li>`;
    });
    ref('pips').innerHTML = pips.join('');
  }

  function renderHints(snapshot: GameSnapshot): void {
    const pinned = snapshot.pinnedHints.map((hint) => hintMarkup(hint, 'pinned'));
    const unlocked = snapshot.hints.map((hint, index) =>
      hintMarkup(hint, index >= renderedHints && renderedStatus !== null ? 'new' : 'plain'),
    );
    const locked = Array.from(
      { length: snapshot.hintsRemaining },
      () => `<li class="hint hint--locked"><span class="hint__lock">${ICONS.lock}</span><span>Pista bloqueada</span></li>`,
    );
    hintsList.innerHTML =
      [...pinned, ...unlocked, ...locked].join('') || '<li class="hint hint--empty">Sem pistas neste nível. Só a imagem.</li>';
    renderedHints = snapshot.hints.length;
  }

  function hintVisual(hint: Hint): string {
    switch (hint.visual.type) {
      case 'swatch':
        return `<span class="hint__swatch" style="background:${escapeHtml(hint.visual.color)}"></span>`;
      case 'icon':
        return `<img class="hint__ability" src="${deps.assetUrl(hint.visual.icon)}" alt="" width="28" height="28" loading="lazy" />${
          hint.visual.key ? `<kbd class="hint__key">${escapeHtml(hint.visual.key)}</kbd>` : ''
        }`;
      case 'key':
        return `<kbd class="hint__key hint__key--large">${escapeHtml(hint.visual.key)}</kbd>`;
      case 'text':
        return '';
    }
  }

  function hintMarkup(hint: Hint, state: 'pinned' | 'new' | 'plain'): string {
    const stateClass = state === 'pinned' ? ' hint--pinned' : state === 'new' ? ' is-new' : '';
    const wide = hint.value.length > 60 ? ' hint--wide' : '';
    return `
      <li class="hint${stateClass}${wide}">
        <span class="hint__label">${escapeHtml(hint.label)}${state === 'pinned' ? '<span class="hint__tag">Sempre visível</span>' : ''}</span>
        <span class="hint__value">${hintVisual(hint)}<span>${escapeHtml(hint.value)}</span></span>
      </li>`;
  }

  function renderGuesses(snapshot: GameSnapshot): void {
    ref('guesses-section').hidden = snapshot.guesses.length === 0;
    ref('guesses').innerHTML = [...snapshot.guesses]
      .reverse()
      .map((record) => {
        const icon = iconUrl(record.answer.icon);
        return `
        <li class="guess-chip guess-chip--${record.correct ? 'hit' : 'miss'}${icon ? '' : ' guess-chip--plain'}">
          ${icon ? `<img src="${icon}" alt="" width="28" height="28" loading="lazy" />` : ''}
          <span>${escapeHtml(record.answer.name)}</span>
          <span class="guess-chip__mark" aria-label="${record.correct ? 'correto' : 'incorreto'}">${record.correct ? ICONS.check : ICONS.cross}</span>
        </li>`;
      })
      .join('');
  }

  function renderControls(snapshot: GameSnapshot): void {
    const canGuess = snapshot.status === 'PLAYING' || snapshot.status === 'INCORRECT';
    combobox.setDisabled(!canGuess);
    hintButton.disabled = !canGuess || snapshot.hintsRemaining === 0;
    guessArea.hidden = snapshot.status === 'RESULT';
    result.hidden = snapshot.status !== 'RESULT';
    if (canGuess && renderedStatus === 'LOADING') input.focus();
  }

  function renderResult(summary: RoundSummary): void {
    const { copy } = controller.mode;
    const score = summary.score;
    const nextStep = deps.flow.nextStep();
    const penalties: [string, number][] = [
      ['Erros', score.wrongGuesses],
      ['Pistas', score.hints],
      ['Revelação', score.reveal],
      ['Tempo', score.time],
    ];
    const details = summary.question.details
      .map((detail) => `<div><dt>${escapeHtml(detail.label)}</dt><dd>${escapeHtml(detail.value)}</dd></div>`)
      .join('');
    result.innerHTML = `
      <div class="result__banner result__banner--${summary.won ? 'win' : 'loss'}">
        <span class="result__banner-icon">${summary.won ? ICONS.check : ICONS.cross}</span>
        <span>${summary.won ? 'Você acertou!' : 'Você não acertou'}</span>
      </div>
      <p class="result__agent">
        <span class="eyebrow">${summary.won ? escapeHtml(copy.answerLabel) : 'A resposta era'}</span>
        <span class="result__agent-name">${escapeHtml(summary.question.answer.name)}</span>
      </p>
      ${details ? `<dl class="result__details">${details}</dl>` : ''}
      <dl class="result__stats">
        <div><dt>Tentativas</dt><dd>${summary.attempts}/${summary.maxAttempts}</dd></div>
        <div><dt>Tempo</dt><dd>${formatSeconds(summary.elapsedMs)}</dd></div>
        <div><dt>Pistas usadas</dt><dd>${summary.hintsUsed}</dd></div>
        <div class="result__score"><dt>Pontuação</dt><dd data-ref="score">0</dd></div>
      </dl>
      ${
        summary.won
          ? `<ul class="breakdown" aria-label="Cálculo da pontuação">
              <li><span>Base</span><span>${score.base}</span></li>
              ${penalties.map(([label, value]) => `<li><span>${label}</span><span>${value ? `−${value}` : '0'}</span></li>`).join('')}
              <li><span>Multiplicador ${escapeHtml(controller.preset.label)}</span><span>×${score.multiplier.toFixed(2)}</span></li>
            </ul>`
          : ''
      }
      <div class="result__actions">
        <button type="button" class="btn btn--primary btn--xl" data-action="next">${escapeHtml(nextStep.label)}</button>
        <button type="button" class="btn btn--ghost" data-action="menu">Voltar ao menu</button>
        ${deps.flow.allowsRoundShare ? '<button type="button" class="btn btn--ghost" data-action="share">Compartilhar resultado</button>' : ''}
      </div>
      <p class="result__share-status" role="status" data-ref="share-status"></p>`;

    animateNumber(ref('score'), score.total);
    const next = requireElement<HTMLButtonElement>(result, '[data-action="next"]');
    next.addEventListener('click', () => (nextStep.kind === 'round' ? void startRound() : nextStep.go()));
    requireElement<HTMLButtonElement>(result, '[data-action="menu"]').addEventListener('click', deps.onExit);
    result.querySelector('[data-action="share"]')?.addEventListener('click', () => shareResult(summary));
    next.focus();
  }

  function shareResult(summary: RoundSummary): void {
    const text = buildShareText(summary, {
      emoji: controller.challenge.shareEmoji,
      modeLabel: controller.challenge.shareLabel,
      difficultyLabel: controller.preset.label,
    });
    const status = ref('share-status');
    const showManualCopy = () => {
      status.innerHTML = `<span>Copie o texto abaixo:</span><textarea class="share-box" rows="6" readonly>${escapeHtml(text)}</textarea>`;
      requireElement<HTMLTextAreaElement>(status, 'textarea').select();
    };
    if (!navigator.clipboard) {
      showManualCopy();
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      status.textContent = 'Resultado copiado. Cole onde quiser compartilhar.';
    }, showManualCopy);
  }

  function tickTimer(): void {
    timer.textContent = formatDuration(controller.elapsedMs());
  }

  async function startRound(): Promise<void> {
    window.clearTimeout(resultHandle);
    renderedHints = 0;
    renderedStatus = null;
    feedback.textContent = '';
    delete feedback.dataset.tone;
    delete image.dataset.src;
    pixelCanvas.clear();
    result.innerHTML = '';
    combobox.clear();
    tickTimer();
    try {
      await deps.flow.startRound();
    } catch (error) {
      console.error(error);
      showFeedback('error', error instanceof Error ? error.message : 'Não foi possível iniciar a rodada.');
    }
  }

  ref('hint-cost').textContent = `−${deps.hintPenalty}`;
  const timerHandle = window.setInterval(tickTimer, TIMER_INTERVAL_MS);

  return {
    element,
    start: () => void startRound(),
    destroy() {
      pixelCanvas.destroy();
      window.clearInterval(timerHandle);
      window.clearTimeout(resultHandle);
      unsubscribe();
    },
  };
}

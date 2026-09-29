import type { DailyChallenge } from '../../application/dailyChallenge';
import { animateNumber, createFragment, escapeHtml, formatCountdown, formatSeconds, ICONS, requireElement } from '../dom';

export interface DailySummaryDeps {
  readonly daily: DailyChallenge;
  readonly onExit: () => void;
}

const OUTCOME_LABELS = {
  pending: 'Não jogada',
  playing: 'Em andamento',
  won: 'Acertou',
  lost: 'Errou',
  abandoned: 'Abandonada',
} as const;

export function createDailySummaryScreen({ daily, onExit }: DailySummaryDeps): HTMLElement {
  const rows = daily
    .stages()
    .map(({ challenge, mode, record }) => {
      const attempts = record.status === 'won' ? `${record.attempts}/${record.maxAttempts}` : '—';
      return `
      <li class="daily-row daily-row--${record.status}">
        <span class="daily-row__icon">${ICONS[challenge.id]}</span>
        <span class="daily-row__main">
          <span class="daily-row__stage">${escapeHtml(challenge.label)} · ${escapeHtml(mode.label)}</span>
          <span class="daily-row__answer">${escapeHtml(record.answerName ?? 'Sem resposta')}</span>
        </span>
        <span class="daily-row__chip">${record.status === 'won' ? ICONS.check : ICONS.cross}${OUTCOME_LABELS[record.status]}</span>
        <span class="daily-row__metric"><small>Tentativas</small>${attempts}</span>
        <span class="daily-row__metric"><small>Tempo</small>${record.elapsedMs ? formatSeconds(record.elapsedMs) : '—'}</span>
        <span class="daily-row__metric daily-row__metric--score"><small>Pontos</small>${record.score}</span>
      </li>`;
    })
    .join('');

  const element = requireElement<HTMLElement>(
    createFragment(`
    <section class="daily-summary" aria-labelledby="daily-summary-title">
      <header class="daily-summary__head">
        <p class="eyebrow">Desafio do dia · ${escapeHtml(daily.day().split('-').reverse().join('/'))}</p>
        <h1 class="daily-summary__title" id="daily-summary-title">Jornada concluída</h1>
        <p class="daily-summary__total"><span class="eyebrow">Total</span><span data-ref="total">0</span><span class="daily-summary__unit">pontos</span></p>
      </header>
      <ol class="daily-rows">${rows}</ol>
      <p class="daily-summary__next">Próximo desafio em <strong data-countdown>${formatCountdown(daily.msUntilNextDay())}</strong></p>
      <div class="result__actions">
        <button type="button" class="btn btn--primary btn--xl" data-action="daily-share">Compartilhar resultado</button>
        <button type="button" class="btn btn--ghost" data-action="daily-exit">Voltar ao menu</button>
      </div>
      <p class="result__share-status" role="status" data-ref="share-status"></p>
    </section>`),
    '.daily-summary',
  );

  animateNumber(requireElement<HTMLElement>(element, '[data-ref="total"]'), daily.total());
  requireElement<HTMLButtonElement>(element, '[data-action="daily-exit"]').addEventListener('click', onExit);
  requireElement<HTMLButtonElement>(element, '[data-action="daily-share"]').addEventListener('click', () => {
    const text = daily.shareText();
    const status = requireElement<HTMLElement>(element, '[data-ref="share-status"]');
    const showManualCopy = () => {
      status.innerHTML = `<span>Copie o texto abaixo:</span><textarea class="share-box" rows="9" readonly>${escapeHtml(text)}</textarea>`;
      requireElement<HTMLTextAreaElement>(status, 'textarea').select();
    };
    if (!navigator.clipboard) {
      showManualCopy();
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      status.textContent = 'Resultado copiado. Ele não revela as respostas.';
    }, showManualCopy);
  });
  return element;
}

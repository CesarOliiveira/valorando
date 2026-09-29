import type { DailyChallenge } from '../../application/dailyChallenge';
import { DIFFICULTY_LABELS } from '../../config/gameConfig';
import { escapeHtml, formatCountdown, ICONS } from '../dom';

const numberFormat = new Intl.NumberFormat('pt-BR');

const STAGE_STATUS_LABELS = {
  pending: 'Pendente',
  playing: 'Em andamento',
  won: 'Acertou',
  lost: 'Errou',
  abandoned: 'Abandonada',
} as const;

export function dailyCardMarkup(daily: DailyChallenge): string {
  const status = daily.status();
  const stages = daily
    .stages()
    .map(
      ({ challenge, record }) => `
      <li class="daily-chain__step daily-chain__step--${record.status}" title="${challenge.label}: ${STAGE_STATUS_LABELS[record.status]}">
        <span class="daily-chain__icon">${ICONS[challenge.id]}</span>
        <span class="daily-chain__name">${escapeHtml(challenge.label)}</span>
        <span class="sr-only">${STAGE_STATUS_LABELS[record.status]}</span>
      </li>`,
    )
    .join('');
  const current = daily.currentStage();
  const action =
    status === 'complete'
      ? `<button type="button" class="btn btn--ghost" data-action="daily-summary">Ver resultado de hoje</button>`
      : `<button type="button" class="btn btn--primary" data-action="daily-play">${
          status === 'available' ? 'Começar desafio do dia' : `Continuar · ${escapeHtml(current?.challenge.label ?? '')}`
        }</button>`;
  const statusLine =
    status === 'complete'
      ? `Concluído hoje com <strong>${numberFormat.format(daily.total())} pontos</strong>. Novo desafio em <span class="daily-card__countdown" data-countdown>${formatCountdown(daily.msUntilNextDay())}</span>.`
      : `Quatro etapas seguidas, os mesmos desafios para todos hoje, dificuldade ${DIFFICULTY_LABELS[daily.difficulty].label}. Só uma tentativa por dia; sair no meio de uma etapa conta como derrota nela.`;

  return `
    <section class="daily-card daily-card--${status}" aria-labelledby="daily-title">
      <div class="daily-card__head">
        <span class="daily-card__badge">${ICONS.calendar}<span>${escapeHtml(daily.day().split('-').reverse().join('/'))}</span></span>
        <h2 class="daily-card__title" id="daily-title">Desafio do dia · Contínuo</h2>
      </div>
      <ol class="daily-chain">${stages}</ol>
      <p class="daily-card__text">${statusLine}</p>
      <div class="daily-card__actions">${action}</div>
    </section>`;
}

export function startCountdowns(root: HTMLElement, msUntilNextDay: () => number, onNewDay: () => void): () => void {
  const handle = window.setInterval(() => {
    const remaining = msUntilNextDay();
    root.querySelectorAll<HTMLElement>('[data-countdown]').forEach((element) => {
      element.textContent = formatCountdown(remaining);
    });
    if (remaining <= 1000) onNewDay();
  }, 1000);
  return () => window.clearInterval(handle);
}

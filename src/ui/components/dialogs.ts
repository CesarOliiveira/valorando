import type { GameController } from '../../application/gameController';
import { createFragment, formatPercent, ICONS, requireElement } from '../dom';
import { bindSetupFields, readSetup, setupFieldsMarkup } from './setupFields';

function createDialogShell(id: string, title: string): { dialog: HTMLDialogElement; body: HTMLElement } {
  const fragment = createFragment(`
    <dialog class="dialog" id="${id}" aria-labelledby="${id}-title">
      <div class="dialog__panel">
        <header class="dialog__head">
          <h2 class="dialog__title" id="${id}-title">${title}</h2>
          <button type="button" class="icon-btn" data-close aria-label="Fechar">${ICONS.close}</button>
        </header>
        <div class="dialog__body"></div>
      </div>
    </dialog>`);
  const dialog = requireElement<HTMLDialogElement>(fragment, 'dialog');
  document.body.append(fragment);
  dialog.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target === dialog || target.closest('[data-close]')) dialog.close();
  });
  return { dialog, body: requireElement<HTMLElement>(dialog, '.dialog__body') };
}

const ledgerRow = (label: string, value: string) => `<div class="ledger__row"><dt>${label}</dt><dd>${value}</dd></div>`;

export function createStatsDialog(controller: GameController): { open(): void } {
  const { dialog, body } = createDialogShell('stats-dialog', 'Estatísticas');
  return {
    open() {
      const overall = controller.overallStats();
      const perChallenge = controller.catalog.challenges
        .map((challenge) => {
          const stats = controller.challengeStats(challenge.id);
          return `
            <div class="mode-stats__row">
              <span class="mode-stats__name">${ICONS[challenge.id]}${challenge.label}</span>
              <span><small>Partidas</small>${stats.played}</span>
              <span><small>Taxa</small>${stats.played ? formatPercent(stats.winRate) : '—'}</span>
              <span><small>Média</small>${stats.averageAttempts ? stats.averageAttempts.toFixed(1) : '—'}</span>
            </div>`;
        })
        .join('');
      body.innerHTML = `
        <section class="stats-section" aria-labelledby="stats-overall">
          <h3 class="eyebrow" id="stats-overall">Geral</h3>
          <dl class="ledger">
            ${ledgerRow('Partidas jogadas', String(overall.played))}
            ${ledgerRow('Acertos', String(overall.wins))}
            ${ledgerRow('Taxa de acerto', formatPercent(overall.winRate))}
            ${ledgerRow('Sequência atual', String(overall.currentStreak))}
            ${ledgerRow('Melhor sequência', String(overall.bestStreak))}
            ${ledgerRow('Média de tentativas', overall.averageAttempts ? overall.averageAttempts.toFixed(1) : '—')}
            ${ledgerRow('Melhor pontuação', String(overall.bestScore))}
          </dl>
        </section>
        <section class="stats-section" aria-labelledby="stats-modes">
          <h3 class="eyebrow" id="stats-modes">Por desafio</h3>
          <div class="mode-stats">${perChallenge}</div>
        </section>
        <p class="note">Salvas neste navegador.</p>`;
      dialog.showModal();
    },
  };
}

export function createSettingsDialog(controller: GameController, onSaved: () => void): { open(): void } {
  const { dialog, body } = createDialogShell('settings-dialog', 'Configurações');
  return {
    open() {
      body.innerHTML = `
        <form class="settings-form" id="settings-form" method="dialog">
          ${setupFieldsMarkup('dialog', controller.catalog, controller.settings)}
          <p class="note">As mudanças valem a partir da próxima rodada.</p>
          <div class="dialog__actions">
            <button type="button" class="btn btn--ghost" data-close>Cancelar</button>
            <button type="submit" class="btn btn--primary">Salvar</button>
          </div>
        </form>`;
      const form = requireElement<HTMLFormElement>(body, 'form');
      bindSetupFields(form, 'dialog', controller.catalog, () => undefined);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        controller.updateSettings(readSetup(form, controller.catalog, controller.settings));
        dialog.close();
        onSaved();
      });
      dialog.showModal();
    },
  };
}

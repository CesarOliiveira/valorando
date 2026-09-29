const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export function createFragment(markup: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content;
}

export function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Elemento não encontrado: ${selector}`);
  return element;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function replayAnimation(element: HTMLElement, className: string): void {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  element.addEventListener('animationend', () => element.classList.remove(className), { once: true });
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatSeconds(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1).replace('.', ',')}s`;
  const totalSeconds = Math.floor(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}m ${String(totalSeconds % 60).padStart(2, '0')}s`;
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const parts = [Math.floor(totalSeconds / 3600), Math.floor((totalSeconds % 3600) / 60), totalSeconds % 60];
  return parts.map((part) => String(part).padStart(2, '0')).join(':');
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function animateNumber(element: HTMLElement, target: number, durationMs = 800): void {
  if (prefersReducedMotion() || target === 0) {
    element.textContent = String(target);
    return;
  }
  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / durationMs);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export const ICONS = {
  flame:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 3.5-1.5 5-1.5 7.5A2.5 2.5 0 0 0 13 12c1.6 0 2.5-1.2 2.5-3 2 1.8 3.5 4.3 3.5 7a7 7 0 0 1-14 0c0-4.6 3.8-7.3 7-14Z" fill="currentColor"/></svg>',
  chart:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  sliders:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="16" cy="6" r="2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="10" cy="12" r="2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="18" cy="18" r="2" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
  cross:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  warning:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.5 20h19L12 4Z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M12 10v4.5M12 17.5v.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  agents:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  weapons:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9h15l1-2h4v4h-3l-1 2h-5l-1.5 2H10l-1 5H5l1.5-7H2V9Z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
  skins:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.3-1.8-.4-1.2.3-2.2 1.6-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="7.5" cy="11" r="1.4" fill="currentColor"/><circle cx="10.5" cy="7" r="1.4" fill="currentColor"/><circle cx="15.5" cy="7.5" r="1.4" fill="currentColor"/></svg>',
  abilities:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
  calendar:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
} as const;

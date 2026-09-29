import type { AnswerOption } from '../../domain/question';
import { escapeHtml } from '../dom';

export interface AnswerComboboxOptions {
  readonly input: HTMLInputElement;
  readonly listbox: HTMLUListElement;
  readonly search: (query: string) => AnswerOption[];
  readonly iconUrl: (option: AnswerOption) => string | null;
  readonly onSelect: (option: AnswerOption) => void;
  readonly onReject: (query: string) => void;
}

export interface AnswerCombobox {
  clear(): void;
  close(): void;
  setDisabled(disabled: boolean): void;
  setPlaceholder(text: string): void;
}

export function createAnswerCombobox(options: AnswerComboboxOptions): AnswerCombobox {
  const { input, listbox } = options;
  let results: AnswerOption[] = [];
  let activeIndex = -1;

  const optionId = (index: number) => `${listbox.id}-option-${index}`;

  function render(): void {
    const isOpen = results.length > 0;
    input.setAttribute('aria-expanded', String(isOpen));
    listbox.hidden = !isOpen;
    listbox.innerHTML = results
      .map(
        (option, index) => {
          const icon = options.iconUrl(option);
          return `
        <li id="${optionId(index)}" role="option" class="combo__option" data-index="${index}" aria-selected="${index === activeIndex}">
          ${icon ? `<img src="${icon}" alt="" width="32" height="32" loading="lazy" decoding="async" />` : ''}
          <span>${escapeHtml(option.name)}</span>
        </li>`;
        },
      )
      .join('');
    if (activeIndex >= 0) {
      input.setAttribute('aria-activedescendant', optionId(activeIndex));
      keepOptionVisible(listbox, listbox.children[activeIndex] as HTMLElement | undefined);
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function refresh(): void {
    results = options.search(input.value);
    activeIndex = results.length > 0 ? 0 : -1;
    render();
  }

  function close(): void {
    results = [];
    activeIndex = -1;
    render();
  }

  function moveActive(delta: number): void {
    if (results.length === 0) {
      refresh();
      return;
    }
    activeIndex = (activeIndex + delta + results.length) % results.length;
    render();
  }

  function commit(): void {
    const query = input.value;
    const candidates = options.search(query);
    const exact = candidates.find((option) => option.name.toLowerCase() === query.trim().toLowerCase());
    const chosen = results[activeIndex] ?? exact ?? (candidates.length === 1 ? candidates[0] : undefined);
    if (chosen) {
      close();
      options.onSelect(chosen);
    } else {
      options.onReject(query);
    }
  }

  input.addEventListener('input', refresh);
  input.addEventListener('focus', () => input.value && refresh());
  input.addEventListener('blur', () => window.setTimeout(close, 120));
  input.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveActive(-1);
        break;
      case 'Enter':
        event.preventDefault();
        commit();
        break;
      case 'Escape':
        close();
        break;
    }
  });
  listbox.addEventListener('mousedown', (event) => event.preventDefault());
  listbox.addEventListener('click', (event) => {
    const option = (event.target as HTMLElement).closest<HTMLElement>('[data-index]');
    if (!option) return;
    activeIndex = Number(option.dataset.index);
    commit();
  });

  return {
    clear() {
      input.value = '';
      close();
    },
    close,
    setDisabled(disabled) {
      input.disabled = disabled;
      if (disabled) close();
    },
    setPlaceholder(text) {
      input.placeholder = text;
    },
  };
}

function keepOptionVisible(listbox: HTMLElement, option: HTMLElement | undefined): void {
  if (!option) return;
  const top = option.offsetTop;
  const bottom = top + option.offsetHeight;
  if (top < listbox.scrollTop) listbox.scrollTop = top;
  else if (bottom > listbox.scrollTop + listbox.clientHeight) listbox.scrollTop = bottom - listbox.clientHeight;
}

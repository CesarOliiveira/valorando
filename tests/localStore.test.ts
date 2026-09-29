import { describe, expect, it } from 'vitest';
import { createLocalStore } from '../src/infrastructure/localStore';

function fakeStorage(initial: Record<string, string>): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    key: (index) => [...data.keys()][index] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
    clear: () => data.clear(),
  };
}

describe('armazenamento local', () => {
  it('apaga os dados antigos do Valdle, preserva outros sites e grava com o prefixo novo', () => {
    const storage = fakeStorage({
      'valdle:v1:stats-book': '{}',
      'valdle:v1:daily-run': '{}',
      'outro-app:config': '1',
    });
    const store = createLocalStore(storage);
    expect(storage.getItem('valdle:v1:stats-book')).toBeNull();
    expect(storage.getItem('valdle:v1:daily-run')).toBeNull();
    expect(storage.getItem('outro-app:config')).toBe('1');

    store.write('settings', { mode: 'weapon' });
    expect(storage.getItem('valorando:v1:settings')).toBe('{"mode":"weapon"}');
  });
});

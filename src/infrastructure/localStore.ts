const NAMESPACE = 'valorando:v1:';
const DISCARDED_NAMESPACES = ['valdle:v1:'];

export interface KeyValueStore {
  read<T, F = T>(key: string, fallback: F, isValid: (value: unknown) => value is T): T | F;
  write(key: string, value: unknown): void;
}

export function createLocalStore(storage: Storage | null = safeLocalStorage()): KeyValueStore {
  removeDiscardedNamespaces(storage);
  return {
    read(key, fallback, isValid) {
      try {
        const raw = storage?.getItem(NAMESPACE + key);
        if (raw == null) return fallback;
        const parsed: unknown = JSON.parse(raw);
        return isValid(parsed) ? parsed : fallback;
      } catch (error) {
        console.warn(`Não foi possível ler "${key}" do armazenamento local.`, error);
        return fallback;
      }
    },
    write(key, value) {
      try {
        storage?.setItem(NAMESPACE + key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Não foi possível salvar "${key}" no armazenamento local.`, error);
      }
    },
  };
}

function removeDiscardedNamespaces(storage: Storage | null): void {
  if (!storage) return;
  try {
    const discarded = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
      (key): key is string => key !== null && DISCARDED_NAMESPACES.some((prefix) => key.startsWith(prefix)),
    );
    discarded.forEach((key) => storage.removeItem(key));
  } catch (error) {
    console.warn('Não foi possível remover dados antigos do armazenamento local.', error);
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

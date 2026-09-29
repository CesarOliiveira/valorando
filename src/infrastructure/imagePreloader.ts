const cache = new Map<string, Promise<void>>();

export function preloadImage(url: string): Promise<void> {
  const cached = cache.get(url);
  if (cached) return cached;
  const loading = loadImage(url).catch((error: unknown) => {
    cache.delete(url);
    throw error;
  });
  cache.set(url, loading);
  return loading;
}

function loadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      image.decode().then(resolve, () => resolve());
    };
    image.onerror = () => reject(new Error(`Falha ao carregar a imagem ${url}`));
    image.src = url;
  });
}

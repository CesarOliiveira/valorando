import type { ImageFit } from '../../domain/rules';
import { prefersReducedMotion } from '../dom';

export interface PixelCanvas {
  show(url: string): Promise<void>;
  clear(): void;
  setFit(fit: ImageFit): void;
  setPixels(blocks: number): void;
  destroy(): void;
}

interface DrawArea {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const TRANSITION_MS = 650;
const READY_CLASS = 'is-ready';

export function createPixelCanvas(canvas: HTMLCanvasElement): PixelCanvas {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D indisponível neste navegador.');
  const buffer = document.createElement('canvas');
  const bufferContext = buffer.getContext('2d');
  if (!bufferContext) throw new Error('Canvas 2D indisponível neste navegador.');

  let image: HTMLImageElement | null = null;
  let fit: ImageFit = 'portrait';
  let currentBlocks = 0;
  let targetBlocks = 0;
  let frameHandle = 0;
  let loadToken = 0;

  const resizeObserver = new ResizeObserver(() => {
    syncCanvasSize();
    draw(currentBlocks);
  });
  resizeObserver.observe(canvas);

  function syncCanvasSize(): void {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function drawArea(source: HTMLImageElement): DrawArea {
    const scale = Math.min(canvas.width / source.naturalWidth, canvas.height / source.naturalHeight);
    const width = source.naturalWidth * scale;
    const height = source.naturalHeight * scale;
    const y = fit === 'portrait' ? canvas.height - height : (canvas.height - height) / 2;
    return { x: (canvas.width - width) / 2, y, width, height };
  }

  function draw(blocks: number): void {
    context!.clearRect(0, 0, canvas.width, canvas.height);
    if (!image) return;
    const area = drawArea(image);
    if (blocks <= 0 || blocks >= area.width) {
      context!.imageSmoothingEnabled = true;
      context!.drawImage(image, area.x, area.y, area.width, area.height);
      return;
    }
    buffer.width = Math.max(1, Math.round(blocks));
    buffer.height = Math.max(1, Math.round((blocks * area.height) / area.width));
    bufferContext!.imageSmoothingEnabled = true;
    bufferContext!.imageSmoothingQuality = 'high';
    bufferContext!.clearRect(0, 0, buffer.width, buffer.height);
    bufferContext!.drawImage(image, 0, 0, buffer.width, buffer.height);
    context!.imageSmoothingEnabled = false;
    context!.drawImage(buffer, area.x, area.y, area.width, area.height);
  }

  function fullResolutionBlocks(): number {
    return image ? drawArea(image).width : 0;
  }

  function animateTo(target: number): void {
    cancelAnimationFrame(frameHandle);
    const from = currentBlocks > 0 ? currentBlocks : fullResolutionBlocks();
    const to = target > 0 ? target : fullResolutionBlocks();
    if (!image || prefersReducedMotion() || from <= 0 || to <= 0 || from === to) {
      currentBlocks = target;
      draw(currentBlocks);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / TRANSITION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      currentBlocks = progress < 1 ? from * Math.pow(to / from, eased) : target;
      draw(currentBlocks);
      if (progress < 1) frameHandle = requestAnimationFrame(step);
    };
    frameHandle = requestAnimationFrame(step);
  }

  function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const element = new Image();
      element.decoding = 'async';
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error(`Falha ao carregar a imagem ${url}`));
      element.src = url;
    });
  }

  return {
    async show(url) {
      const token = ++loadToken;
      const loaded = await loadImage(url);
      if (token !== loadToken) return;
      image = loaded;
      currentBlocks = targetBlocks;
      syncCanvasSize();
      draw(currentBlocks);
      canvas.classList.add(READY_CLASS);
    },
    clear() {
      loadToken += 1;
      cancelAnimationFrame(frameHandle);
      image = null;
      canvas.classList.remove(READY_CLASS);
      draw(0);
    },
    setFit(nextFit) {
      if (fit === nextFit) return;
      fit = nextFit;
      draw(currentBlocks);
    },
    setPixels(blocks) {
      if (blocks === targetBlocks) return;
      targetBlocks = blocks;
      if (image) animateTo(blocks);
      else currentBlocks = blocks;
    },
    destroy() {
      cancelAnimationFrame(frameHandle);
      resizeObserver.disconnect();
    },
  };
}

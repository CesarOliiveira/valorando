import { prefersReducedMotion } from '../dom';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  color: string;
}

const PARTICLE_COUNT = 70;
const DURATION_MS = 1400;
const GRAVITY = 0.16;

export function burstConfetti(origin: HTMLElement, colors: readonly string[]): void {
  if (prefersReducedMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);

  const ratio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  const context = canvas.getContext('2d');
  if (!context) {
    canvas.remove();
    return;
  }
  context.scale(ratio, ratio);

  const bounds = origin.getBoundingClientRect();
  const particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(bounds, colors));
  const start = performance.now();

  const frame = (now: number) => {
    const elapsed = now - start;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    context.globalAlpha = Math.max(0, 1 - elapsed / DURATION_MS);
    particles.forEach((particle) => drawParticle(context, particle));
    if (elapsed < DURATION_MS) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

function createParticle(bounds: DOMRect, colors: readonly string[]): Particle {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
  const speed = 5 + Math.random() * 6;
  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height * 0.45,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 4 + Math.random() * 5,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

function drawParticle(context: CanvasRenderingContext2D, particle: Particle): void {
  particle.vy += GRAVITY;
  particle.vx *= 0.99;
  particle.x += particle.vx;
  particle.y += particle.vy;
  particle.rotation += particle.spin;
  context.save();
  context.translate(particle.x, particle.y);
  context.rotate(particle.rotation);
  context.fillStyle = particle.color;
  context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
  context.restore();
}

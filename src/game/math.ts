export type V = { x: number; y: number };

export const TAU = Math.PI * 2;

export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpAngle(a: number, b: number, t: number): number {
  const d = ((b - a + Math.PI) % TAU) - Math.PI;
  return a + d * t;
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.hypot(dx, dy);
}

export function len(x: number, y: number): number {
  return Math.hypot(x, y);
}

export function norm(x: number, y: number): V {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}

export function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

export function pick<T>(arr: readonly T[]): T {
  return arr[(Math.random() * arr.length) | 0]!;
}

export function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function nowMs(): number {
  return performance.now();
}

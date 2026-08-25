export function lsGet(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / blocked storage */
  }
}

export function lsNum(key: string, fallback: number): number {
  const n = Number(lsGet(key, String(fallback)));
  return Number.isFinite(n) ? n : fallback;
}

export interface Rng {
  /** Float in [0, 1). Only for choosing; never for money. */
  next(): number;
  /** Integer in [min, max], both inclusive. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  chance(probability: number): boolean;
  weighted<T>(entries: readonly { item: T; weight: number }[]): T;
}

/** FNV-1a: turns any seed (number or string) into a 32-bit starting state. */
export function hashSeed(seed: string | number): number {
  let hash = 0x811c9dc5;
  for (const char of String(seed)) {
    hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: a tiny 32-bit generator; same state in, same sequence out. */
function mulberry32(initialState: number): () => number {
  let state = initialState;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: string | number): Rng {
  const next = mulberry32(hashSeed(seed));
  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`Invalid integer range [${min}, ${max}]`);
    }
    return min + Math.floor(next() * (max - min + 1));
  };
  const pick = <T>(items: readonly T[]): T => {
    const chosen = items[int(0, items.length - 1)];
    if (chosen === undefined) throw new RangeError('Cannot pick from an empty list');
    return chosen;
  };
  const chance = (probability: number): boolean => next() < probability;
  const weighted = <T>(entries: readonly { item: T; weight: number }[]): T => {
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let remaining = next() * total;
    for (const entry of entries) {
      remaining -= entry.weight;
      if (remaining < 0) return entry.item;
    }
    return pick(entries).item;
  };
  return { next, int, pick, chance, weighted };
}

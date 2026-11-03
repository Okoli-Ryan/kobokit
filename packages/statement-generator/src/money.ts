/**
 * Money is an integer number of kobo (1 naira = 100 kobo). The brand makes the compiler reject a
 * bare `number` where kobo is expected, so a float cannot slip in by accident.
 */
export type Kobo = number & { readonly __unit: 'kobo' };

const KOBO_PER_NAIRA = 100;

export function kobo(value: number): Kobo {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Kobo must be a safe integer, got ${value}`);
  }
  return value as Kobo;
}

export function naira(wholeNaira: number): Kobo {
  return kobo(wholeNaira * KOBO_PER_NAIRA);
}

export function addKobo(a: Kobo, b: Kobo): Kobo {
  return kobo(a + b);
}

export function subtractKobo(a: Kobo, b: Kobo): Kobo {
  return kobo(a - b);
}

/** Splits at the decimal point with integer maths only, e.g. 123456789 -> "1,234,567.89". */
export function formatKobo(amount: Kobo): string {
  const sign = amount < 0 ? '-' : '';
  const absolute = Math.abs(amount);
  const wholeNaira = Math.floor(absolute / KOBO_PER_NAIRA);
  const fraction = String(absolute % KOBO_PER_NAIRA).padStart(2, '0');
  const grouped = String(wholeNaira).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${grouped}.${fraction}`;
}

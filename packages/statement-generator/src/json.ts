import type { Statement } from './statement';

/** Same bytes in, same bytes out: two-space JSON plus a trailing newline. */
export const toJson = (statement: Statement): string => `${JSON.stringify(statement, null, 2)}\n`;

import type { DateStyle } from '../dates';
import type { DraftTransaction, Statement, UnpagedStatement } from '../statement';
import { FAMILIES, type BodyLine } from './families';

/** Body lines that fit on page 1 (it also carries the account summary) and on later pages. */
export const FIRST_PAGE_LINES = 42;
export const OTHER_PAGE_LINES = 48;

export interface Page {
  /** 1-based. */
  number: number;
  lines: BodyLine[];
}

const capacityOf = (pageNumber: number): number =>
  pageNumber === 1 ? FIRST_PAGE_LINES : OTHER_PAGE_LINES;

/** A date heading needs room for itself and at least one row, so it is never stranded. */
function splitIntoPages(lines: readonly BodyLine[]): Page[] {
  let current: Page = { number: 1, lines: [] };
  const pages = [current];
  for (const line of lines) {
    const needed = line.kind === 'group' ? 2 : 1;
    if (current.lines.length + needed > capacityOf(current.number)) {
      current = { number: current.number + 1, lines: [] };
      pages.push(current);
    }
    current.lines.push(line);
  }
  return pages;
}

export function paginate(
  transactions: readonly DraftTransaction[],
  family: UnpagedStatement['format'],
  dateStyle: DateStyle,
): Page[] {
  return splitIntoPages(FAMILIES[family].buildLines(transactions, dateStyle));
}

/** Page and line come from the same page model the PDF is drawn from, so they cannot disagree. */
export function withPositions(statement: UnpagedStatement, dateStyle: DateStyle): Statement {
  const pages = paginate(statement.transactions, statement.format, dateStyle);
  const positions = new Map<number, { page: number; line: number }>();
  for (const page of pages) {
    page.lines.forEach((line, index) => {
      if (line.txIndex !== undefined)
        positions.set(line.txIndex, { page: page.number, line: index + 1 });
    });
  }
  return {
    ...statement,
    transactions: statement.transactions.map((tx, index) => ({
      ...tx,
      page: positions.get(index)?.page ?? 0,
      line: positions.get(index)?.line ?? 0,
    })),
  };
}

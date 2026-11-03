import { rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { formatKobo } from '../money';
import type { Statement } from '../statement';
import type { BodyLine, Column } from '../layout/families';

export interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

export const PAGE_SIZE: [number, number] = [595.28, 841.89];
const ROW_HEIGHT = 14;
const BODY_SIZE = 8;
const MIN_SIZE = 4;
const MARGIN = 36;
const BLACK = rgb(0, 0, 0);

/** Shrinks text to fit its column instead of cutting it, so no narration is ever truncated. */
function drawCell(page: PDFPage, text: string, column: Column, y: number, font: PDFFont): void {
  if (text === '') return;
  let size = BODY_SIZE;
  while (size > MIN_SIZE && font.widthOfTextAtSize(text, size) > column.width) size -= 0.25;
  const width = font.widthOfTextAtSize(text, size);
  const x = column.align === 'right' ? column.x + column.width - width : column.x;
  page.drawText(text, { x, y, size, font, color: BLACK });
}

export function drawColumnHeaders(page: PDFPage, columns: Column[], y: number, fonts: Fonts): void {
  columns.forEach((column) => drawCell(page, column.header, column, y, fonts.bold));
  page.drawLine({
    start: { x: MARGIN, y: y - 4 },
    end: { x: PAGE_SIZE[0] - MARGIN, y: y - 4 },
    thickness: 0.5,
    color: BLACK,
  });
}

export function drawBody(
  page: PDFPage,
  lines: BodyLine[],
  columns: Column[],
  topY: number,
  fonts: Fonts,
): void {
  lines.forEach((line, index) => {
    const y = topY - index * ROW_HEIGHT;
    const first = columns[0];
    if (line.kind === 'group' && first) {
      drawCell(page, line.cells[0] ?? '', { ...first, width: 300 }, y, fonts.bold);
      return;
    }
    line.cells.forEach((text, i) => {
      const column = columns[i];
      if (column) drawCell(page, text, column, y, fonts.regular);
    });
  });
}

export function drawFirstPageHeader(
  page: PDFPage,
  statement: Statement,
  bank: string,
  fonts: Fonts,
): void {
  const [, height] = PAGE_SIZE;
  const line = (text: string, y: number, font: PDFFont, size = 9): void => {
    page.drawText(text, { x: MARGIN, y: height - y, size, font, color: BLACK });
  };
  line(bank, 50, fonts.bold, 16);
  line('STATEMENT OF ACCOUNT (SYNTHETIC)', 68, fonts.regular, 10);
  line(`Account name: ${statement.accountHolder.name}`, 90, fonts.regular);
  line(`Account number: ${statement.accountHolder.accountNumber}`, 102, fonts.regular);
  line(`Period: ${statement.period.from} to ${statement.period.to}`, 114, fonts.regular);
  line(`Opening balance (NGN): ${formatKobo(statement.openingBalance)}`, 126, fonts.regular);
  line(`Closing balance (NGN): ${formatKobo(statement.closingBalance)}`, 138, fonts.regular);
}

export function drawRunningHeader(
  page: PDFPage,
  statement: Statement,
  bank: string,
  fonts: Fonts,
): void {
  const text = `${bank} - ${statement.accountHolder.accountNumber} - ${statement.period.from} to ${statement.period.to}`;
  page.drawText(text, { x: MARGIN, y: PAGE_SIZE[1] - 50, size: 9, font: fonts.bold, color: BLACK });
}

/** Distance from the top of the page to the column header row, and to the first body line. */
export const FIRST_PAGE_TABLE_TOP = { header: 165, body: 183 };
export const OTHER_PAGE_TABLE_TOP = { header: 75, body: 93 };

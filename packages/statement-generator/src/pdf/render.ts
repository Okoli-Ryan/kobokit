import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { BankProfile } from '../banks';
import { FAMILIES } from '../layout/families';
import { paginate, type Page } from '../layout/paginate';
import type { Statement } from '../statement';
import {
  FIRST_PAGE_TABLE_TOP,
  OTHER_PAGE_TABLE_TOP,
  PAGE_SIZE,
  drawBody,
  drawColumnHeaders,
  drawFirstPageHeader,
  drawRunningHeader,
  type Fonts,
} from './draw';
import { applyMetadata, parseModifiedAt } from './metadata';
import { drawFooter, drawWatermark } from './watermark';

export interface RenderOptions {
  /** ISO timestamp for the PDF modification date. Defaults to the tamper record, if any. */
  modifiedAt?: string;
}

function drawPage(doc: PDFDocument, page: Page, total: number, input: DrawInput): void {
  const pdfPage = doc.addPage(PAGE_SIZE);
  const { statement, bank, fonts } = input;
  const columns = FAMILIES[statement.format].columns;
  const first = page.number === 1;
  const top = first ? FIRST_PAGE_TABLE_TOP : OTHER_PAGE_TABLE_TOP;
  if (first) drawFirstPageHeader(pdfPage, statement, bank.name, fonts);
  else drawRunningHeader(pdfPage, statement, bank.name, fonts);
  drawColumnHeaders(pdfPage, columns, PAGE_SIZE[1] - top.header, fonts);
  drawBody(pdfPage, page.lines, columns, PAGE_SIZE[1] - top.body, fonts);
  drawFooter(pdfPage, fonts.regular, page.number, total);
  drawWatermark(pdfPage, fonts.bold);
}

interface DrawInput {
  statement: Statement;
  bank: BankProfile;
  fonts: Fonts;
}

/** Text is drawn with a standard font, so every character stays selectable and extractable. */
export async function renderPdf(
  statement: Statement,
  bank: BankProfile,
  options: RenderOptions = {},
): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const pages = paginate(statement.transactions, statement.format, bank.dateStyle);
  for (const page of pages) drawPage(doc, page, pages.length, { statement, bank, fonts });
  const modifiedAt = options.modifiedAt ?? statement.tampering?.pdfModifiedAt;
  const modified = modifiedAt === undefined ? undefined : parseModifiedAt(modifiedAt);
  applyMetadata(doc, statement, bank.name, modified);
  return doc.save({ useObjectStreams: false });
}

import type { PDFDocument } from 'pdf-lib';
import { PDF_PRODUCER } from '../constants';
import { addDays, parseIsoDate } from '../dates';
import type { Statement } from '../statement';

/** The day after the period ends, at midnight UTC. Derived from the data, never from the clock. */
export function creationDateFor(statement: Statement): Date {
  const dayAfter = addDays(parseIsoDate(statement.period.to), 1);
  return new Date(Date.UTC(dayAfter.year, dayAfter.month - 1, dayAfter.day));
}

export function parseModifiedAt(iso: string): Date {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) throw new RangeError(`Invalid modifiedAt "${iso}"`);
  return parsed;
}

export function applyMetadata(
  doc: PDFDocument,
  statement: Statement,
  bankName: string,
  modified: Date | undefined,
): void {
  const creation = creationDateFor(statement);
  doc.setTitle(`Synthetic statement - ${bankName}`);
  doc.setSubject('Synthetic test data. Not a real bank statement.');
  doc.setKeywords(['synthetic', 'test-data']);
  doc.setProducer(PDF_PRODUCER);
  doc.setCreator(PDF_PRODUCER);
  doc.setCreationDate(creation);
  doc.setModificationDate(modified ?? creation);
}

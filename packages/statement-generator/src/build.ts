import { getBank, type BankProfile } from './banks';
import { generateStatementData, type GenerateOptions } from './generate';
import { withPositions } from './layout/paginate';
import type { Statement } from './statement';

export interface GeneratedStatement {
  statement: Statement;
  /** Needed later to draw the PDF with this bank's date style. */
  bank: BankProfile;
}

/** The whole pipeline up to (not including) the PDF: data, then page and line positions. */
export function generateStatement(options: GenerateOptions): GeneratedStatement {
  const bank = typeof options.bank === 'string' ? getBank(options.bank) : options.bank;
  const data = generateStatementData({ ...options, bank });
  return { statement: withPositions(data, bank.dateStyle), bank };
}

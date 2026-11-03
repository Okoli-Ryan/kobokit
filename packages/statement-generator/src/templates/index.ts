import { z } from 'zod';
import { CATEGORIES, type Category } from '../types';
import airtimeData from './airtime_data.json';
import atm from './atm.json';
import bankCharge from './bank_charge.json';
import betting from './betting.json';
import bill from './bill.json';
import loanDisbursement from './loan_disbursement.json';
import loanRepayment from './loan_repayment.json';
import pos from './pos.json';
import reversal from './reversal.json';
import salary from './salary.json';
import transferIn from './transfer_in.json';
import transferOut from './transfer_out.json';

/**
 * Every template says where it came from. Today everything is "invented"; patterns copied from
 * redacted real statements will be added later under "redacted-real-pattern".
 */
const templateFileSchema = z.object({
  category: z.enum(CATEGORIES),
  templates: z
    .array(
      z.object({
        text: z.string().min(1),
        tag: z.string().optional(),
        origin: z.enum(['invented', 'redacted-real-pattern']),
      }),
    )
    .min(1),
});

export type NarrationTemplate = z.infer<typeof templateFileSchema>['templates'][number];

const files: readonly unknown[] = [
  salary,
  transferIn,
  transferOut,
  pos,
  atm,
  airtimeData,
  bill,
  betting,
  loanDisbursement,
  loanRepayment,
  bankCharge,
  reversal,
];

const byCategory = new Map<Category, readonly NarrationTemplate[]>(
  files.map((file) => {
    const parsed = templateFileSchema.parse(file);
    return [parsed.category, parsed.templates];
  }),
);

export function getTemplates(category: Category): readonly NarrationTemplate[] {
  const found = byCategory.get(category);
  if (!found) throw new RangeError(`No narration templates for category "${category}"`);
  return found;
}

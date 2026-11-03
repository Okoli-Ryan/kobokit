import { z } from 'zod';
import { PERSONA_CATEGORIES } from './types';

const kobo = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

const range = z
  .object({ min: kobo, max: kobo })
  .refine((r) => r.min <= r.max, { message: 'min must not exceed max' });

const activity = z.object({
  category: z.enum(PERSONA_CATEGORIES),
  /** How many of these the persona plans each month (a plain count, not money). */
  perMonth: range,
  /** Amount of each occurrence, in kobo. */
  amount: range,
  /** Chance that each planned occurrence really happens; below 1 makes the pattern irregular. */
  probability: z.number().min(0).max(1),
});

export const personaSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  openingBalance: range,
  salary: z.object({ dayOfMonth: z.number().int().min(1).max(28), amount: range }).optional(),
  activities: z.array(activity),
  /** Chance that a failed-looking debit is later reversed. */
  reversalProbability: z.number().min(0).max(1).default(0.02),
});

export type Persona = z.infer<typeof personaSchema>;
export type PersonaInput = z.input<typeof personaSchema>;

/** Validates user-supplied config at the edge so the generator can trust its input. */
export function parsePersona(input: unknown): Persona {
  const result = personaSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new TypeError(`Invalid persona: ${issues.join('; ')}`);
  }
  return result.data;
}

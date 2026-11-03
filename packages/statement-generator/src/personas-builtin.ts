import { parsePersona, type Persona, type PersonaInput } from './personas';

type Activity = PersonaInput['activities'][number];

const N = 100; // kobo per naira: keeps the numbers below readable as naira
const nairaRange = (min: number, max: number) => ({ min: min * N, max: max * N });
const count = (min: number, max: number) => ({ min, max });

const spend = (
  category: Activity['category'],
  perMonth: [number, number],
  amount: [number, number],
  probability = 1,
): Activity => ({
  category,
  perMonth: count(...perMonth),
  amount: nairaRange(...amount),
  probability,
});

// All figures are invented to look plausible, not measured from real data.
const definitions: PersonaInput[] = [
  {
    id: 'salaried',
    label: 'Salaried employee',
    openingBalance: nairaRange(40_000, 300_000),
    salary: { dayOfMonth: 25, amount: nairaRange(250_000, 600_000) },
    activities: [
      spend('transfer_out', [4, 8], [5_000, 60_000], 0.9),
      spend('transfer_in', [0, 2], [5_000, 40_000], 0.4),
      spend('pos', [8, 16], [1_500, 25_000], 0.9),
      spend('atm', [1, 3], [10_000, 50_000], 0.8),
      spend('airtime_data', [2, 4], [500, 5_000]),
      spend('bill', [2, 3], [5_000, 35_000]),
    ],
  },
  {
    id: 'trader',
    label: 'Market trader',
    openingBalance: nairaRange(20_000, 500_000),
    activities: [
      spend('transfer_in', [30, 60], [2_000, 250_000], 0.85),
      spend('pos', [20, 40], [1_000, 80_000], 0.9),
      spend('transfer_out', [10, 25], [10_000, 300_000], 0.85),
      spend('atm', [2, 6], [20_000, 100_000], 0.8),
      spend('airtime_data', [2, 4], [500, 5_000]),
      spend('bill', [1, 2], [5_000, 40_000]),
    ],
  },
  {
    id: 'gig-worker',
    label: 'Gig worker',
    openingBalance: nairaRange(5_000, 120_000),
    activities: [
      spend('transfer_in', [6, 18], [3_000, 90_000], 0.6),
      spend('pos', [6, 14], [800, 15_000], 0.85),
      spend('transfer_out', [3, 8], [2_000, 40_000], 0.8),
      spend('atm', [1, 3], [5_000, 30_000], 0.7),
      spend('airtime_data', [3, 6], [300, 3_000]),
      spend('bill', [1, 2], [3_000, 20_000], 0.8),
    ],
  },
  {
    id: 'bettor',
    label: 'Frequent bettor',
    openingBalance: nairaRange(10_000, 200_000),
    salary: { dayOfMonth: 28, amount: nairaRange(120_000, 280_000) },
    activities: [
      spend('betting', [15, 40], [500, 30_000], 0.9),
      spend('transfer_in', [4, 10], [1_000, 50_000], 0.5),
      spend('pos', [5, 12], [1_000, 12_000], 0.8),
      spend('transfer_out', [2, 6], [2_000, 25_000], 0.8),
      spend('airtime_data', [2, 5], [300, 3_000]),
    ],
  },
  {
    id: 'loan-stacker',
    label: 'Borrower with several loans',
    openingBalance: nairaRange(3_000, 80_000),
    salary: { dayOfMonth: 26, amount: nairaRange(150_000, 350_000) },
    activities: [
      spend('loan_disbursement', [2, 4], [10_000, 150_000], 0.8),
      spend('loan_repayment', [4, 9], [8_000, 90_000], 0.9),
      spend('pos', [5, 10], [1_000, 12_000], 0.85),
      spend('transfer_out', [3, 7], [3_000, 40_000], 0.8),
      spend('airtime_data', [2, 4], [300, 3_000]),
    ],
  },
];

export const BUILT_IN_PERSONAS: readonly Persona[] = definitions.map(parsePersona);

export function getBuiltInPersona(id: string): Persona {
  const found = BUILT_IN_PERSONAS.find((persona) => persona.id === id);
  if (!found) {
    const known = BUILT_IN_PERSONAS.map((persona) => persona.id).join(', ');
    throw new RangeError(`Unknown persona "${id}". Built-in personas: ${known}`);
  }
  return found;
}

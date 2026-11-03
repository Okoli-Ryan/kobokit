# @kobokit/statement-generator

Realistic but clearly fake Nigerian-style bank statements, as a text PDF plus a JSON answer key, so statement parsers, fraud detectors and AI pipelines can be tested without anyone's real data.

![A generated page: fictional bank, diagonal SYNTHETIC watermark, footer line](./docs/harmattan-page-1.png)

## Why this exists

Lenders judge income and affordability from bank statements, but statements are personal data, so developers building parsers have nothing safe to share or test against. This package generates statements with the correct answer attached: every amount, running balance, page and line is known, and a "tampered" mode records exactly what was forged.

## Safety rules (not configurable)

- **Fictional banks only:** Harmattan Bank, Kola Digital, Ember Wallet and Savanna Trust are invented. No real bank name, logo or copied layout is used.
- **Watermark on every page:** a diagonal `SYNTHETIC - NOT A REAL BANK STATEMENT`, plus the same sentence in every footer. Tampered statements keep it.
- **PDF metadata:** Producer and Creator are `kobokit statement-generator (synthetic)`.
- **Obviously fake identities:** account numbers always start with `000`; names are random pairs from a made-up pool; narrations come from templates marked `origin: "invented"`.
- **No real data in, none out.** Fee amounts, phone numbers and similar details are invented and marked `TODO` in the source, not claims about any real bank or rule.

## Quick start

```bash
pnpm add -D @kobokit/statement-generator

# one statement: writes a PDF and a JSON file
npx kobokit-statements generate --persona salaried --months 6 --bank harmattan --seed 42 --out ./out

# the same, with two forged amounts (balances left unfixed) and a later PDF modification date
npx kobokit-statements generate --persona salaried --months 6 --bank harmattan --seed 42 --out ./out \
  --tamper amount,date --tamper-count 2

# 40 statements across every persona and bank, a fifth of them tampered, with a manifest.json
npx kobokit-statements batch --count 40 --months 6 --seed eval-1 --tamper-ratio 0.2 --out ./dataset
```

The same seed and options always give byte-identical JSON. Dates never come from the clock: statements start on `2026-01-01` unless you pass `--start YYYY-MM-DD`.

## What you get

| Option                        | Values                                                          |
| ----------------------------- | --------------------------------------------------------------- |
| `--persona`                   | `salaried`, `trader`, `gig-worker`, `bettor`, `loan-stacker`    |
| `--persona-file`              | path to your own persona JSON (validated, see below)            |
| `--bank`                      | `harmattan`, `kola`, `ember`, `savanna`                         |
| `--months`                    | 1 to 12 (default 6)                                             |
| `--tamper` / `--tamper-count` | `amount`, `date` or `amount,date`; how many amounts (default 1) |

Three layout families, so a parser meets different shapes:

| Bank           | Layout                                    | Dates         |
| -------------- | ----------------------------------------- | ------------- |
| Harmattan Bank | one amount column plus a `DR`/`CR` marker | `01/03/2026`  |
| Kola Digital   | separate debit and credit columns         | `2026-03-01`  |
| Ember Wallet   | rows grouped under a date heading         | `01 Mar 2026` |
| Savanna Trust  | separate debit and credit columns         | `01-Mar-2026` |

### The JSON

Shortened from `sample-output/harmattan_salaried_sample_2m.json`:

```jsonc
{
  "bank": "Harmattan Bank",
  "format": "single-amount-drcr",
  "persona": "salaried",
  "accountHolder": { "name": "EMEKA HASSAN", "accountNumber": "0005057058" },
  "period": { "from": "2026-01-01", "to": "2026-02-28" },
  "openingBalance": 6097300, // integer kobo, never floats
  "closingBalance": 34664609,
  "transactions": [
    {
      "id": "TX000001",
      "date": "2026-01-01",
      "narration": "NIP DR/DAYO FASHOLA/5051776548",
      "debit": 2791100, // 0 when the row is a credit
      "credit": 0,
      "balance": 3306200,
      "category": "transfer_out",
      "page": 1, // where it sits in the PDF
      "line": 1,
    },
  ],
}
```

Categories: `salary`, `transfer_in`, `transfer_out`, `pos`, `atm`, `airtime_data`, `bill`, `betting`, `loan_disbursement`, `loan_repayment`, `bank_charge`, `reversal`.

All money is integer kobo (1 naira = 100 kobo). `opening + credits - debits = closing`, and every running balance is exact.

### Tampered statements

`--tamper amount` changes amounts without fixing the running balances; `--tamper date` sets a PDF modification date later than the creation date. The JSON gains a `tampering` record:

```jsonc
"tampering": {
  "amountChanges": [
    { "id": "TX000013", "index": 12, "page": 1, "line": 13,
      "field": "debit", "original": 711700, "tampered": 227744 },
    { "id": "TX000017", "index": 16, "page": 1, "line": 17,
      "field": "debit", "original": 3565900, "tampered": 677521 }
  ],
  "pdfModifiedAt": "2026-04-27T10:58:00.000Z"
}
```

Reconciliation breaks on exactly the listed rows, which makes it easy to score a detector.

## Custom personas

A persona is typed config, validated with zod. Money is integer kobo.

```ts
import { generateStatement, parsePersona, renderPdf } from '@kobokit/statement-generator';

const persona = parsePersona({
  id: 'night-market',
  label: 'Night-market seller',
  openingBalance: { min: 2_000_000, max: 8_000_000 },
  activities: [
    // 20 to 30 inflows a month, each 3,000 to 80,000 naira, each happening with 90% chance
    {
      category: 'transfer_in',
      perMonth: { min: 20, max: 30 },
      amount: { min: 300_000, max: 8_000_000 },
      probability: 0.9,
    },
  ],
  // optional: salary: { dayOfMonth: 25, amount: { min: ..., max: ... } }, reversalProbability: 0.02
});

const { statement, bank } = generateStatement({ seed: 'demo', persona, bank: 'kola', months: 3 });
const pdf = await renderPdf(statement, bank); // Uint8Array
```

Use `verifyBalances(statement)` to check a statement (generated or yours): it reports which rows break and whether the totals match.

## How it works

`options + seed` goes through a seeded PRNG (own sub-stream per concern), a planner that picks events from persona probabilities, a single ledger that is the only code to compute balances (a debit that would overdraw is dropped together with its fee), a layout step that assigns `page` and `line`, and a `pdf-lib` renderer. Narration text comes from JSON templates under `src/templates/`, one file per category; add real-world-style patterns there with `origin: "redacted-real-pattern"` once they are redacted.

Decisions and concepts are written up in the repository's `docs/DECISIONS.md` and `docs/LEARNING.md`.

## Sample output

`sample-output/` has one statement per bank (PDF and JSON, seed `sample`, two months) and one tampered example. Rebuild it with `pnpm build && pnpm samples`; a test fails if the committed files drift from what the generator produces.

## Development

```bash
pnpm --filter @kobokit/statement-generator test        # unit, property (fast-check), round-trip and tamper tests
pnpm --filter @kobokit/statement-generator preview-page sample-output/kola_trader_sample_2m.pdf /tmp/page.png 1 1.3
```

The tests cover: balances reconcile for any seed and persona; same seed gives identical JSON; every amount, balance and narration is found by `pdfjs` on the page the JSON states; the watermark and footer are on every page; metadata is set; and tampering breaks reconciliation exactly where the JSON says.

## Limits

- Output is text-based PDF only (no scanned or photographed variants).
- Only the standard Helvetica font is used, so amounts print without the naira sign and headings say `NGN`.
- Fee amounts, charge names and phone-number formats are invented. TODO: replace with sourced, redacted real patterns before treating any of it as representative.
- Layouts are our own designs for variety, not imitations of any real bank.

## License

MIT

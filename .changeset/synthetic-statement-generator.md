---
'@kobokit/statement-generator': minor
---

First real release: generate synthetic Nigerian-style bank statements as a text PDF plus a JSON answer key.

- Four fictional banks across three layout families, five built-in personas and custom personas.
- Integer-kobo money, seeded generation (same seed, same JSON), balances that always reconcile.
- Diagonal watermark and footer on every page, and PDF metadata that names the generator.
- Tamper mode that changes amounts without fixing balances and records exactly what changed.
- `kobokit-statements generate` and `batch` commands, with a manifest for eval datasets.

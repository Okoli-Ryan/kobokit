# @kobokit/statement-generator

## 0.1.1

### Patch Changes

- 40435a5: Documentation only: a much fuller README with eight usage scenarios, a reference table for every export and type, the JSON and persona field tables, the CLI flags, the error table and the known limits. The screenshot now uses an absolute URL so it shows on the npm page.
- 1b54cdf: Safety fix: the `bank` option now accepts only the built-in bank ids (`harmattan`, `kola`, `ember`, `savanna`). `renderPdf` rejects any bank profile that is not an exact copy of a built-in one. Before, a custom `BankProfile` object could put any bank name on a statement. Code that passed a profile object must pass an id instead.

## 0.1.0

### Minor Changes

- d2df90d: First real release: generate synthetic Nigerian-style bank statements as a text PDF plus a JSON answer key.

  - Four fictional banks across three layout families, five built-in personas and custom personas.
  - Integer-kobo money, seeded generation (same seed, same JSON), balances that always reconcile.
  - Diagonal watermark and footer on every page, and PDF metadata that names the generator.
  - Tamper mode that changes amounts without fixing balances and records exactly what changed.
  - `kobokit-statements generate` and `batch` commands, with a manifest for eval datasets.

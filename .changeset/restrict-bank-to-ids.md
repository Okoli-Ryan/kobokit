---
'@kobokit/statement-generator': patch
---

Safety fix: the `bank` option now accepts only the built-in bank ids (`harmattan`, `kola`, `ember`, `savanna`). `renderPdf` rejects any bank profile that is not an exact copy of a built-in one. Before, a custom `BankProfile` object could put any bank name on a statement. Code that passed a profile object must pass an id instead.

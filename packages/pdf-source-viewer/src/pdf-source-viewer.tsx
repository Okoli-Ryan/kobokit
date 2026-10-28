export type PdfSourceViewerProps = {
  documentTitle: string;
};

/** Placeholder until the real viewer lands. TODO: render the PDF and highlight source spans. */
export function PdfSourceViewer({ documentTitle }: PdfSourceViewerProps) {
  return <section aria-label={documentTitle}>PDF source viewer placeholder</section>;
}

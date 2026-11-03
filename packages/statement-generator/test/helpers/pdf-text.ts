import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export interface TextItem {
  str: string;
  /** The PDF text matrix [a, b, c, d, x, y]; b and c are non-zero for rotated text. */
  transform: number[];
}

export interface ExtractedPdf {
  /** Text items per page, in the order they were drawn. */
  pages: TextItem[][];
  info: Record<string, unknown>;
}

/** Reads a PDF the way a statement parser would: only the text layer, no pixels. */
export async function extractPdf(bytes: Uint8Array): Promise<ExtractedPdf> {
  const doc = await getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise;
  const pages: TextItem[][] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    pages.push(
      content.items.flatMap((item) =>
        'str' in item && item.str !== '' ? [{ str: item.str, transform: item.transform }] : [],
      ),
    );
  }
  const metadata = await doc.getMetadata();
  return { pages, info: metadata.info as Record<string, unknown> };
}

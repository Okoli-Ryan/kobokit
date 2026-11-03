// Dev tool: renders one page of a PDF to a PNG (used for the README screenshot and for eyeballing
// layouts). Usage: node scripts/pdf-to-png.mjs <in.pdf> <out.png> [page=1] [scale=1.5]
import { createCanvas } from '@napi-rs/canvas';
import console from 'node:console';
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { URL, pathToFileURL } from 'node:url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const [input, output, pageArg = '1', scaleArg = '1.5'] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/pdf-to-png.mjs <in.pdf> <out.png> [page] [scale]');
  process.exit(1);
}

const fontDir = new URL(
  '../node_modules/pdfjs-dist/standard_fonts/',
  pathToFileURL(`${process.cwd()}/`),
);
const doc = await getDocument({
  data: new Uint8Array(readFileSync(input)),
  standardFontDataUrl: fontDir.href,
  verbosity: 0,
}).promise;
const page = await doc.getPage(Number(pageArg));
const viewport = page.getViewport({ scale: Number(scaleArg) });
const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
await page.render({ canvasContext: canvas.getContext('2d'), canvas, viewport }).promise;
writeFileSync(output, canvas.toBuffer('image/png'));
console.log(`Wrote ${output} (page ${pageArg} of ${doc.numPages})`);

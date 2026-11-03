import { degrees, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { WATERMARK_TEXT } from '../constants';

const SIZE = 30;
const ANGLE = 45;

/** Drawn last, in translucent red across the middle of the page, so nothing hides it. */
export function drawWatermark(page: PDFPage, font: PDFFont): void {
  const { width, height } = page.getSize();
  const textWidth = font.widthOfTextAtSize(WATERMARK_TEXT, SIZE);
  const radians = (ANGLE * Math.PI) / 180;
  // Text rotates about its start point, so start half a text-length back along the diagonal.
  page.drawText(WATERMARK_TEXT, {
    x: width / 2 - (textWidth / 2) * Math.cos(radians),
    y: height / 2 - (textWidth / 2) * Math.sin(radians),
    size: SIZE,
    font,
    rotate: degrees(ANGLE),
    color: rgb(0.8, 0.1, 0.1),
    opacity: 0.22,
  });
}

export function drawFooter(page: PDFPage, font: PDFFont, pageNumber: number, total: number): void {
  page.drawText(`${WATERMARK_TEXT} | Page ${pageNumber} of ${total}`, {
    x: 36,
    y: 28,
    size: 7,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
}

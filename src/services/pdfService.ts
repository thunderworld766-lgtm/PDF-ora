import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Annotation, PDFPageInfo } from '../types';

// Configure pdfjs worker
// Using CDN or unpkg fallback for worker to guarantee zero bundler issues
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

/**
 * Loads a PDF and extracts basic page metadata
 */
export async function getPdfMetadata(pdfBytes: ArrayBuffer | Uint8Array): Promise<{
  pageCount: number;
  pages: PDFPageInfo[];
}> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pages: PDFPageInfo[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    pages.push({
      pageNumber: i,
      rotation: viewport.rotation,
      width: viewport.width,
      height: viewport.height,
      aspectRatio: viewport.width / viewport.height,
    });
  }

  return { pageCount, pages };
}

/**
 * Renders a specific page onto an HTML5 Canvas
 */
export async function renderPageToCanvas(
  pdfBytes: ArrayBuffer | Uint8Array,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5,
  rotationAngle: number = 0
): Promise<void> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);

  const totalRotation = (page.rotate + rotationAngle) % 360;
  const viewport = page.getViewport({ scale, rotation: totalRotation });

  const context = canvas.getContext('2d');
  if (!context) return;

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width / scale}px`;
  canvas.style.height = `${viewport.height / scale}px`;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
}

/**
 * Generates thumbnail data URL for a given page
 */
export async function generateThumbnail(
  pdfBytes: ArrayBuffer | Uint8Array,
  pageNumber: number
): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale: 0.3 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) return '';

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.8);
}

/**
 * Merges multiple PDF Uint8Arrays into one
 */
export async function mergePdfs(pdfBuffers: (ArrayBuffer | Uint8Array)[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const doc = await PDFDocument.load(buffer);
    const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Splits PDF into specific page ranges
 * ranges example: [[1, 2], [3, 5]] or list of individual pages
 */
export async function splitPdf(
  pdfBytes: ArrayBuffer | Uint8Array,
  pageIndicesToKeep: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const newDoc = await PDFDocument.create();

  const validIndices = pageIndicesToKeep.filter(idx => idx >= 0 && idx < srcDoc.getPageCount());
  const copiedPages = await newDoc.copyPages(srcDoc, validIndices);
  copiedPages.forEach(page => newDoc.addPage(page));

  return await newDoc.save();
}

/**
 * Rotates pages in a PDF
 */
export async function rotatePdfPages(
  pdfBytes: ArrayBuffer | Uint8Array,
  pageRotations: Record<number, number> // pageIndex -> degrees (0, 90, 180, 270)
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();

  Object.entries(pageRotations).forEach(([indexStr, rot]) => {
    const idx = parseInt(indexStr, 10);
    if (pages[idx]) {
      const current = pages[idx].getRotation().angle;
      pages[idx].setRotation(degrees((current + rot) % 360));
    }
  });

  return await doc.save();
}

/**
 * Adds watermark text across all or specified pages
 */
export async function applyWatermark(
  pdfBytes: ArrayBuffer | Uint8Array,
  text: string,
  options?: {
    fontSize?: number;
    opacity?: number;
    colorRgb?: [number, number, number];
    angle?: number;
  }
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  const fontSize = options?.fontSize ?? 48;
  const opacity = options?.opacity ?? 0.25;
  const [r, g, b] = options?.colorRgb ?? [0.5, 0.5, 0.5];
  const angle = options?.angle ?? 45;

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    page.drawText(text, {
      x: width / 2 - (textWidth / 2) * Math.cos((angle * Math.PI) / 180),
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(r, g, b),
      rotate: degrees(angle),
      opacity,
    });
  }

  return await doc.save();
}

/**
 * Reorders or removes pages from a PDF
 */
export async function reorderPdfPages(
  pdfBytes: ArrayBuffer | Uint8Array,
  orderedIndices: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const newDoc = await PDFDocument.create();

  const copiedPages = await newDoc.copyPages(srcDoc, orderedIndices);
  copiedPages.forEach(p => newDoc.addPage(p));

  return await newDoc.save();
}

/**
 * Converts images (data URLs or blobs) into a combined PDF document
 */
export async function imagesToPdf(
  images: { dataUrl: string; width: number; height: number }[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  for (const img of images) {
    let embeddedImg;
    if (img.dataUrl.includes('image/png')) {
      embeddedImg = await doc.embedPng(img.dataUrl);
    } else {
      embeddedImg = await doc.embedJpg(img.dataUrl);
    }

    const page = doc.addPage([embeddedImg.width, embeddedImg.height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: embeddedImg.width,
      height: embeddedImg.height,
    });
  }

  return await doc.save();
}

/**
 * Burn annotations, signatures, and text into PDF
 */
export async function burnAnnotationsIntoPdf(
  pdfBytes: ArrayBuffer | Uint8Array,
  annotations: Annotation[],
  pageRotations: Record<number, number> = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // Apply any pending rotations first
  Object.entries(pageRotations).forEach(([indexStr, rot]) => {
    const idx = parseInt(indexStr, 10);
    if (pages[idx]) {
      const current = pages[idx].getRotation().angle;
      pages[idx].setRotation(degrees((current + rot) % 360));
    }
  });

  for (const ann of annotations) {
    const pageIdx = ann.pageNumber - 1;
    if (pageIdx < 0 || pageIdx >= pages.length) continue;
    const page = pages[pageIdx];
    const { width, height } = page.getSize();

    if (ann.type === 'text' && ann.content) {
      // Calculate position relative to PDF coordinate system (origin bottom-left)
      const x = (ann.x / 100) * width;
      const y = height - (ann.y / 100) * height - (ann.fontSize || 14);

      page.drawText(ann.content, {
        x: Math.max(0, x),
        y: Math.max(0, y),
        size: ann.fontSize || 14,
        font: font,
        color: rgb(0.1, 0.1, 0.15),
      });
    }

    if (ann.type === 'signature' && ann.content) {
      try {
        const pngImage = await doc.embedPng(ann.content);
        const sigWidth = ann.width || 150;
        const sigHeight = ann.height || 60;
        const x = (ann.x / 100) * width;
        const y = height - (ann.y / 100) * height - sigHeight;

        page.drawImage(pngImage, {
          x,
          y,
          width: sigWidth,
          height: sigHeight,
        });
      } catch (err) {
        console.warn('Failed to embed signature into PDF:', err);
      }
    }

    if (ann.type === 'stamp' && ann.content) {
      const x = (ann.x / 100) * width;
      const y = height - (ann.y / 100) * height - 30;

      // Draw stamp border
      page.drawRectangle({
        x,
        y,
        width: 120,
        height: 35,
        borderColor: rgb(0.85, 0.2, 0.2),
        borderWidth: 2,
        color: rgb(1, 0.95, 0.95),
        opacity: 0.9,
      });

      page.drawText(ann.content.toUpperCase(), {
        x: x + 12,
        y: y + 10,
        size: 13,
        font: boldFont,
        color: rgb(0.85, 0.2, 0.2),
      });
    }
  }

  return await doc.save();
}

/**
 * Downloads a byte array as a file in the browser
 */
export function downloadPdf(bytes: Uint8Array, filename: string = 'pdfora-document.pdf') {
  const blob = new Blob([bytes as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

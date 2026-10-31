import * as pdfLib from 'pdf-lib';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { configure, lock, unlockInPlace } from 'pdf-lib-encrypt';

configure(pdfLib);
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { Annotation, PDFPageInfo } from '../types';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
}

const pdfDocumentCache = new WeakMap<object, Promise<any>>();
const canvasRenderTasks = new WeakMap<HTMLCanvasElement, { cancel: () => void }>();

async function loadPdfDocument(pdfBytes: ArrayBuffer | Uint8Array): Promise<any> {
  const cacheKey = pdfBytes as object;
  const cached = pdfDocumentCache.get(cacheKey);
  if (cached) return cached;

  const bytes = pdfBytes instanceof Uint8Array ? pdfBytes.slice() : new Uint8Array(pdfBytes.slice(0));
  const promise = pdfjsLib.getDocument({ data: bytes }).promise;
  pdfDocumentCache.set(cacheKey, promise);
  promise.catch(() => pdfDocumentCache.delete(cacheKey));
  return promise;
}

/**
 * Loads a PDF and extracts basic page metadata
 */
export async function getPdfMetadata(pdfBytes: ArrayBuffer | Uint8Array): Promise<{
  pageCount: number;
  pages: PDFPageInfo[];
}> {
  const pdf = await loadPdfDocument(pdfBytes);
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
  const pdf = await loadPdfDocument(pdfBytes);
  const page = await pdf.getPage(pageNumber);

  const totalRotation = (page.rotate + rotationAngle) % 360;
  const viewport = page.getViewport({ scale, rotation: totalRotation });

  const context = canvas.getContext('2d');
  if (!context) return;

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const baseWidth = viewport.width / scale;
  const baseHeight = viewport.height / scale;
  const mobileFit = typeof window !== 'undefined' && window.innerWidth < 768
    ? Math.min(1, (window.innerWidth - 32) / baseWidth)
    : 1;
  canvas.style.width = `${baseWidth * mobileFit}px`;
  canvas.style.height = `${baseHeight * mobileFit}px`;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  const previousTask = canvasRenderTasks.get(canvas);
  previousTask?.cancel();
  const renderTask = page.render(renderContext);
  canvasRenderTasks.set(canvas, renderTask);
  try {
    await renderTask.promise;
  } catch (error: any) {
    if (error?.name !== 'RenderingCancelledException') throw error;
  } finally {
    if (canvasRenderTasks.get(canvas) === renderTask) canvasRenderTasks.delete(canvas);
  }
}

/**
 * Generates thumbnail data URL for a given page
 */
export async function generateThumbnail(
  pdfBytes: ArrayBuffer | Uint8Array,
  pageNumber: number
): Promise<string> {
  const pdf = await loadPdfDocument(pdfBytes);
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
  if (pdfBuffers.length < 2) throw new Error('Add at least 2 valid PDF files to merge.');
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const bytes = buffer instanceof Uint8Array ? buffer.slice() : new Uint8Array(buffer.slice(0));
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
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
      page.drawRectangle({ x, y, width: 120, height: 35, borderColor: rgb(0.85, 0.2, 0.2), borderWidth: 2, color: rgb(1, 0.95, 0.95), opacity: 0.9 });
      page.drawText(ann.content.toUpperCase(), { x: x + 12, y: y + 10, size: 13, font: boldFont, color: rgb(0.85, 0.2, 0.2) });
    }

    const annX = (ann.x / 100) * width;
    const annYTop = (ann.y / 100) * height;
    const annY = height - annYTop;
    const annWidth = ((ann.width || 20) / 100) * width;
    const annHeight = ((ann.height || 4) / 100) * height;
    const annotationColor = ann.color && /^#[0-9a-f]{6}$/i.test(ann.color)
      ? rgb(parseInt(ann.color.slice(1, 3), 16) / 255, parseInt(ann.color.slice(3, 5), 16) / 255, parseInt(ann.color.slice(5, 7), 16) / 255)
      : rgb(0.96, 0.78, 0.1);

    if (ann.type === 'highlight') {
      page.drawRectangle({ x: annX, y: annY - annHeight, width: annWidth, height: annHeight, color: annotationColor, opacity: ann.opacity ?? 0.35 });
    }
    if (ann.type === 'underline') {
      page.drawLine({ start: { x: annX, y: annY - 2 }, end: { x: annX + annWidth, y: annY - 2 }, thickness: 2, color: annotationColor, opacity: ann.opacity ?? 1 });
    }
    if (ann.type === 'rect') {
      page.drawRectangle({ x: annX, y: annY - annHeight, width: annWidth, height: annHeight, borderColor: annotationColor, borderWidth: 2, opacity: ann.opacity ?? 1 });
    }
    if (ann.type === 'ellipse') {
      page.drawEllipse({ x: annX + annWidth / 2, y: annY - annHeight / 2, xScale: annWidth / 2, yScale: annHeight / 2, borderColor: annotationColor, borderWidth: 2, opacity: ann.opacity ?? 1 });
    }
    if (ann.type === 'line') {
      page.drawLine({ start: { x: annX, y: annY }, end: { x: annX + annWidth, y: annY - annHeight }, thickness: 2, color: annotationColor, opacity: ann.opacity ?? 1 });
    }
    if (ann.type === 'sticky' && ann.content) {
      const stickyWidth = 150;
      const stickyHeight = 90;
      page.drawRectangle({ x: annX, y: annY - stickyHeight, width: stickyWidth, height: stickyHeight, color: rgb(1, 0.92, 0.4), borderColor: rgb(0.75, 0.62, 0.05), borderWidth: 1 });
      page.drawText(ann.content.slice(0, 120), { x: annX + 8, y: annY - 24, size: 11, font });
    }
    if ((ann.type === 'draw' || ann.type === 'line') && ann.points?.length) {
      const first = ann.points[0];
      for (let i = 1; i < ann.points.length; i++) {
        const previous = ann.points[i - 1];
        page.drawLine({
          start: { x: (previous.x / 100) * width, y: height - (previous.y / 100) * height },
          end: { x: (ann.points[i].x / 100) * width, y: height - (ann.points[i].y / 100) * height },
          thickness: ann.fontSize || 2,
          color: annotationColor,
          opacity: ann.opacity ?? 1,
        });
      }
      void first;
    }
  }

  return await doc.save();
}

export async function compressPdf(
  pdfBytes: ArrayBuffer | Uint8Array,
  level: 'low' | 'recommended' | 'extreme' = 'recommended'
): Promise<Uint8Array> {
  const scale = level === 'extreme' ? 0.75 : level === 'recommended' ? 1 : 1.25;
  const jpegQuality = level === 'extreme' ? 0.55 : level === 'recommended' ? 0.72 : 0.86;
  const output = await PDFDocument.create();
  const pdf = await loadPdfDocument(pdfBytes);

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas compression is unavailable in this browser.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;

    const jpegUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    const jpeg = await output.embedJpg(jpegUrl);
    const target = output.addPage([baseViewport.width, baseViewport.height]);
    target.drawImage(jpeg, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height,
    });
  }

  return output.save({ useObjectStreams: true });
}

export async function pdfPagesToImages(
  pdfBytes: ArrayBuffer | Uint8Array,
  format: 'png' | 'jpeg' = 'png',
  scale: number = 2
): Promise<{ name: string; blob: Blob }[]> {
  const pdf = await loadPdfDocument(pdfBytes);
  const images: { name: string; blob: Blob }[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas conversion is unavailable in this browser.');
    if (format === 'jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    await page.render({ canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Image encoding failed.')),
        format === 'png' ? 'image/png' : 'image/jpeg', 0.92);
    });
    images.push({ name: `page-${pageNumber}.${format === 'png' ? 'png' : 'jpg'}`, blob });
  }
  return images;
}

export async function encryptPdf(pdfBytes: ArrayBuffer | Uint8Array, password: string): Promise<Uint8Array> {
  if (!password.trim()) throw new Error('Enter a password.');
  const bytes = pdfBytes instanceof Uint8Array ? pdfBytes.slice() : new Uint8Array(pdfBytes.slice(0));
  return lock(await PDFDocument.load(bytes, { ignoreEncryption: false }).then((doc) => doc.save({ useObjectStreams: false })), password, { algo: 'aes256' });
}

export async function decryptPdf(pdfBytes: ArrayBuffer | Uint8Array, password: string): Promise<Uint8Array> {
  if (!password.trim()) throw new Error('Enter the current PDF password.');
  const bytes = pdfBytes instanceof Uint8Array ? pdfBytes.slice() : new Uint8Array(pdfBytes.slice(0));
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const unlocked = await unlockInPlace(doc, password);
  if (!unlocked) throw new Error('This PDF is not password protected.');
  return doc.save({ useObjectStreams: false });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

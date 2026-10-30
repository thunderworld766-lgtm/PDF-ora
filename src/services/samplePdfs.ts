import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

/**
 * Creates a beautiful sample PDF document on-the-fly for immediate testing
 */
export async function createSamplePDF(title: string = "PDFora Sample Document"): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Overview & Welcome
  const page1 = pdfDoc.addPage([600, 800]);
  const { width: p1W, height: p1H } = page1.getSize();

  // Top header banner
  page1.drawRectangle({
    x: 0,
    y: p1H - 120,
    width: p1W,
    height: 120,
    color: rgb(0.12, 0.23, 0.82), // Deep Brand Indigo
  });

  page1.drawText("PDFORA WORKSTATION", {
    x: 40,
    y: p1H - 50,
    size: 22,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page1.drawText("Everything Your PDF Needs — Fast, Secure, In-Browser", {
    x: 40,
    y: p1H - 75,
    size: 13,
    font: timesRomanFont,
    color: rgb(0.85, 0.9, 1),
  });

  // Body content
  page1.drawText("Document Title: " + title, {
    x: 40,
    y: p1H - 160,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.15, 0.25),
  });

  const lines = [
    "Welcome to your PDFora document preview. This interactive PDF can be freely manipulated",
    "using PDFora's powerful suite of client-side tools without uploading your data to third-party servers.",
    "",
    "Key capabilities supported:",
    "  • Full Page Editing: Add text annotations, custom watermarks, and freehand signatures.",
    "  • Reorganize & Rotate: Rearrange page orders, rotate orientations, or extract pages.",
    "  • Merge & Split: Combine multi-page dossiers or isolate specific chapters.",
    "  • Security & Encryption: Apply passwords and digital stamps before sharing.",
    "  • High-Fidelity Rendering: Driven by PDF.js and pdf-lib for crisp vector graphics.",
    "",
    "Future scalable architecture:",
    "  • Supabase auth & metadata storage.",
    "  • Cloudflare R2 zero-egress bucket synchronization.",
  ];

  let currentY = p1H - 200;
  for (const line of lines) {
    page1.drawText(line, {
      x: 40,
      y: currentY,
      size: 11,
      font: timesRomanFont,
      color: rgb(0.25, 0.3, 0.38),
    });
    currentY -= 20;
  }

  // Feature cards mockup inside PDF
  page1.drawRectangle({
    x: 40,
    y: 120,
    width: 250,
    height: 100,
    borderColor: rgb(0.8, 0.85, 0.95),
    borderWidth: 1,
    color: rgb(0.97, 0.98, 1),
  });
  page1.drawText("Feature: Client-Side Security", {
    x: 55,
    y: 195,
    size: 12,
    font: boldFont,
    color: rgb(0.15, 0.2, 0.6),
  });
  page1.drawText("All processing runs locally in browser.", {
    x: 55,
    y: 175,
    size: 9,
    font: timesRomanFont,
    color: rgb(0.4, 0.45, 0.55),
  });
  page1.drawText("No file leaves your computer without consent.", {
    x: 55,
    y: 160,
    size: 9,
    font: timesRomanFont,
    color: rgb(0.4, 0.45, 0.55),
  });

  page1.drawRectangle({
    x: 310,
    y: 120,
    width: 250,
    height: 100,
    borderColor: rgb(0.8, 0.85, 0.95),
    borderWidth: 1,
    color: rgb(0.97, 0.98, 1),
  });
  page1.drawText("Feature: Instant Export", {
    x: 325,
    y: 195,
    size: 12,
    font: boldFont,
    color: rgb(0.15, 0.2, 0.6),
  });
  page1.drawText("Download directly with embedded annotations,", {
    x: 325,
    y: 175,
    size: 9,
    font: timesRomanFont,
    color: rgb(0.4, 0.45, 0.55),
  });
  page1.drawText("watermarks, and signatures.", {
    x: 325,
    y: 160,
    size: 9,
    font: timesRomanFont,
    color: rgb(0.4, 0.45, 0.55),
  });

  // Footer
  page1.drawText("PDFora Platform — Page 1 of 2", {
    x: 40,
    y: 40,
    size: 10,
    font: timesRomanFont,
    color: rgb(0.6, 0.65, 0.75),
  });

  // Page 2: Sample Invoice / Contract for Signing
  const page2 = pdfDoc.addPage([600, 800]);
  const { width: p2W, height: p2H } = page2.getSize();

  page2.drawText("MUTUAL CONFIDENTIALITY & SERVICE SCHEDULE", {
    x: 40,
    y: p2H - 60,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.15, 0.25),
  });

  page2.drawText("Ref: PDFA-2026-X992 | Execution Copy", {
    x: 40,
    y: p2H - 85,
    size: 10,
    font: timesRomanFont,
    color: rgb(0.5, 0.55, 0.65),
  });

  const contractBody = [
    "1. PURPOSE OF AGREEMENT",
    "The recipient agrees that all proprietary information provided shall remain strictly",
    "confidential and utilized solely for evaluating and implementing PDFora cloud services.",
    "",
    "2. DIGITAL INTEGRITY & COMPLIANCE",
    "PDF files modified through PDFora maintain ISO 32000 standard compliance, preserving",
    "vector definitions, embedded fonts, and interactive form definitions.",
    "",
    "3. SIGNATURE & ACKNOWLEDGEMENT",
    "Please test PDFora's digital signing tool below by adding your signature in the designated box.",
  ];

  let cY = p2H - 130;
  for (const b of contractBody) {
    const isHeading = b.startsWith("1.") || b.startsWith("2.") || b.startsWith("3.");
    page2.drawText(b, {
      x: 40,
      y: cY,
      size: isHeading ? 12 : 10,
      font: isHeading ? boldFont : timesRomanFont,
      color: isHeading ? rgb(0.12, 0.23, 0.82) : rgb(0.25, 0.3, 0.38),
    });
    cY -= 20;
  }

  // Signature box
  page2.drawRectangle({
    x: 40,
    y: 320,
    width: 250,
    height: 90,
    borderColor: rgb(0.7, 0.75, 0.85),
    borderWidth: 1.5,
    color: rgb(0.98, 0.99, 1),
  });
  page2.drawText("Authorized Representative Sign Below:", {
    x: 50,
    y: 395,
    size: 9,
    font: boldFont,
    color: rgb(0.4, 0.45, 0.55),
  });
  page2.drawText("[ Place PDFora Signature or Stamp Here ]", {
    x: 60,
    y: 360,
    size: 10,
    font: timesRomanFont,
    color: rgb(0.65, 0.7, 0.8),
  });

  page2.drawText("PDFora Platform — Page 2 of 2", {
    x: 40,
    y: 40,
    size: 10,
    font: timesRomanFont,
    color: rgb(0.6, 0.65, 0.75),
  });

  return await pdfDoc.save();
}

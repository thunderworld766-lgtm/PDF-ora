import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, 
  Scissors, 
  Minimize2, 
  RotateCw, 
  Lock, 
  ShieldAlert, 
  PenTool, 
  Image as ImageIcon, 
  FileCheck, 
  UploadCloud, 
  Download, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDocument } from '../../context/DocumentContext';
import { ToolType } from '../../types';
import { 
  mergePdfs, 
  splitPdf, 
  rotatePdfPages, 
  applyWatermark, 
  imagesToPdf, 
  downloadPdf,
  downloadBlob,
  getPdfMetadata,
  compressPdf,
  encryptPdf,
  decryptPdf,
  pdfPagesToImages,
  reorderPdfPages
} from '../../services/pdfService';
import { createSamplePDF } from '../../services/samplePdfs';

export const ToolsWorkspace: React.FC = () => {
  const { activeTool, setActiveTool, addToast, setCurrentView, loadPdfFromBuffer } = useDocument();

  const [currentTool, setCurrentTool] = useState<ToolType>(activeTool || 'merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActiveTool, setDragActiveTool] = useState<ToolType | null>(null);

  // Merge State
  const [mergeFiles, setMergeFiles] = useState<{ id: string; name: string; size: string; bytes: Uint8Array }[]>([]);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // Split State
  const [splitFile, setSplitFile] = useState<{ name: string; bytes: Uint8Array; pageCount: number } | null>(null);
  const [splitRange, setSplitRange] = useState('1-2');

  // Rotate State
  const [rotateFile, setRotateFile] = useState<{ name: string; bytes: Uint8Array; pageCount: number } | null>(null);
  const [batchRotation, setBatchRotation] = useState<number>(90);

  // Compress State
  const [compressFile, setCompressFile] = useState<{ name: string; size: number; bytes: Uint8Array } | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'recommended' | 'extreme'>('recommended');
  const [compressedResult, setCompressedResult] = useState<{ newSize: number; savedPercent: number } | null>(null);

  // Protect State
  const [protectFile, setProtectFile] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [protectPassword, setProtectPassword] = useState('');
  const [protectMode, setProtectMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  // Watermark State
  const [watermarkFile, setWatermarkFile] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');

  // Images to PDF State
  const [imageFiles, setImageFiles] = useState<{ id: string; name: string; dataUrl: string; width: number; height: number }[]>([]);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // PDF to Image State
  const [pdfToImgFile, setPdfToImgFile] = useState<{ name: string; bytes: Uint8Array; pageCount: number } | null>(null);
  const [pdfImageFormat, setPdfImageFormat] = useState<'png' | 'jpeg'>('png');
  const [organizeFile, setOrganizeFile] = useState<{ name: string; bytes: Uint8Array; pageCount: number } | null>(null);
  const [organizeOrder, setOrganizeOrder] = useState('');

  useEffect(() => {
    if (activeTool) setCurrentTool(activeTool);
  }, [activeTool]);

  const isPdfFile = (file: File) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  const handleDragEnter = (event: React.DragEvent, tool: ToolType) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActiveTool(tool);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) setDragActiveTool(null);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  };

  const addMergeFiles = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(isPdfFile);
    if (!pdfFiles.length) {
      addToast('error', 'Invalid file type', 'Please drop PDF files only.');
      return;
    }

    const additions = await Promise.all(pdfFiles.map(async (file, index) => {
      const buf = await file.arrayBuffer();
      return {
        id: `${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        bytes: new Uint8Array(buf),
      };
    }));
    setMergeFiles((prev) => [...prev, ...additions]);
    addToast('success', 'PDFs added', `${additions.length} file${additions.length > 1 ? 's' : ''} added to the merge list.`);
  };

  const addImageFiles = (files: FileList | File[]) => {
    const imageFilesToAdd = Array.from(files).filter((file) =>
      file.type === 'image/png' || file.type === 'image/jpeg' || /\.(png|jpe?g)$/i.test(file.name)
    );
    if (!imageFilesToAdd.length) {
      addToast('error', 'Invalid file type', 'Please drop PNG or JPG images only.');
      return;
    }

    imageFilesToAdd.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          setImageFiles((prev) => [...prev, {
            id: `${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            dataUrl: reader.result as string,
            width: img.width,
            height: img.height,
          }]);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const loadSinglePdf = async (file: File, tool: ToolType) => {
    if (!isPdfFile(file)) {
      addToast('error', 'Invalid file type', 'Please drop a PDF file only.');
      return;
    }
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);

    try {
      if (tool === 'split') {
        const meta = await getPdfMetadata(bytes);
        setSplitFile({ name: file.name, bytes, pageCount: meta.pageCount });
      } else if (tool === 'compress') {
        setCompressFile({ name: file.name, size: file.size, bytes });
        setCompressedResult(null);
      } else if (tool === 'rotate') {
        const meta = await getPdfMetadata(bytes);
        setRotateFile({ name: file.name, bytes, pageCount: meta.pageCount });
      } else if (tool === 'protect') {
        setProtectFile({ name: file.name, bytes });
      } else if (tool === 'watermark') {
        setWatermarkFile({ name: file.name, bytes });
      }
    } catch (error: any) {
      addToast('error', 'Could not read PDF', error?.message || 'Please choose a valid PDF file.');
    }
  };

  // Available Tools Switcher List
  const toolsMenu: { id: ToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'merge', label: 'Merge PDF', icon: <Layers className="w-4 h-4 text-indigo-400" /> },
    { id: 'split', label: 'Split PDF', icon: <Scissors className="w-4 h-4 text-sky-400" /> },
    { id: 'compress', label: 'Compress PDF', icon: <Minimize2 className="w-4 h-4 text-violet-400" /> },
    { id: 'rotate', label: 'Rotate Pages', icon: <RotateCw className="w-4 h-4 text-amber-400" /> },
    { id: 'protect', label: 'Protect & Encrypt', icon: <Lock className="w-4 h-4 text-emerald-400" /> },
    { id: 'watermark', label: 'Watermark PDF', icon: <ShieldAlert className="w-4 h-4 text-rose-400" /> },
    { id: 'img-to-pdf', label: 'Image to PDF', icon: <FileCheck className="w-4 h-4 text-fuchsia-400" /> },
    { id: 'pdf-to-img', label: 'PDF to Images', icon: <ImageIcon className="w-4 h-4 text-cyan-400" /> },
    { id: 'organize', label: 'Organize Pages', icon: <Layers className="w-4 h-4 text-orange-400" /> },
  ];

  // Helper to load sample files for quick testing
  const loadSampleForMerge = async () => {
    try {
      const sample1 = await createSamplePDF('PDFora Q3 Brief (Part 1)');
      const sample2 = await createSamplePDF('PDFora Legal Schedule (Part 2)');
      setMergeFiles([
        { id: '1', name: 'Executive_Brief_Part1.pdf', size: '18 KB', bytes: sample1 },
        { id: '2', name: 'Legal_Schedule_Part2.pdf', size: '15 KB', bytes: sample2 },
      ]);
      addToast('info', 'Loaded 2 Sample PDFs for merging');
    } catch (err: any) {
      addToast('error', 'Sample load error', err.message);
    }
  };

  const handleMergeAction = async () => {
    if (mergeFiles.length < 2) {
      addToast('warning', 'Add at least 2 PDF files to merge');
      return;
    }
    try {
      setIsProcessing(true);
      const mergedBytes = await mergePdfs(mergeFiles.map((f) => f.bytes));
      downloadPdf(mergedBytes, 'pdfora_merged_document.pdf');
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      addToast('success', 'PDFs Merged Successfully!', 'Downloaded as pdfora_merged_document.pdf');
    } catch (err: any) {
      addToast('error', 'Merge error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplitAction = async () => {
    if (!splitFile) return;
    try {
      setIsProcessing(true);
      const indices = new Set<number>();
      const parts = splitRange.split(',');
      for (const part of parts) {
        const token = part.trim();
        if (!token) continue;
        if (token.includes('-')) {
          const match = token.match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
          if (!match) throw new Error(`Invalid page range: "${token}"`);
          const start = Number(match[1]);
          const end = Number(match[2]);
          if (start < 1 || end < start || end > splitFile.pageCount) {
            throw new Error(`Page range must be between 1 and ${splitFile.pageCount}.`);
          }
          for (let page = start; page <= end; page++) indices.add(page - 1);
        } else {
          if (!/^\d+$/.test(token)) throw new Error(`Invalid page number: "${token}"`);
          const page = Number(token);
          if (page < 1 || page > splitFile.pageCount) {
            throw new Error(`Page number must be between 1 and ${splitFile.pageCount}.`);
          }
          indices.add(page - 1);
        }
      }
      if (!indices.size) throw new Error('Enter at least one valid page number.');

      const resultBytes = await splitPdf(splitFile.bytes, Array.from(indices));
      downloadPdf(resultBytes, `pdfora_split_${splitRange}.pdf`);
      addToast('success', 'PDF Split Done!', `Pages ${splitRange} extracted.`);
    } catch (err: any) {
      addToast('error', 'Split error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotateAction = async () => {
    if (!rotateFile) return;
    try {
      setIsProcessing(true);
      const rotations: Record<number, number> = {};
      for (let i = 0; i < rotateFile.pageCount; i++) {
        rotations[i] = batchRotation;
      }
      const rotated = await rotatePdfPages(rotateFile.bytes, rotations);
      downloadPdf(rotated, `pdfora_rotated_${batchRotation}deg.pdf`);
      addToast('success', 'Pages Rotated!', `All ${rotateFile.pageCount} pages turned by ${batchRotation}°.`);
    } catch (err: any) {
      addToast('error', 'Rotate error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompressAction = async () => {
    if (!compressFile) return;
    try {
      setIsProcessing(true);
      const optimized = await compressPdf(compressFile.bytes, compressionLevel);
      const savedPercent = Math.max(0, Math.round((1 - optimized.byteLength / compressFile.size) * 100));
      setCompressedResult({ newSize: optimized.byteLength, savedPercent });
      downloadPdf(optimized, `pdfora_compressed_${compressFile.name}`);
      addToast('success', 'PDF Compressed!', `Reduced by ${savedPercent}%. Download ready.`);
    } catch (err: any) {
      addToast('error', 'Compression error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProtectAction = async () => {
    if (!protectFile || !protectPassword) return;
    try {
      setIsProcessing(true);
      const result = protectMode === 'encrypt'
        ? await encryptPdf(protectFile.bytes, protectPassword)
        : await decryptPdf(protectFile.bytes, protectPassword);
      downloadPdf(result, `pdfora_${protectMode === 'encrypt' ? 'protected' : 'unlocked'}_${protectFile.name}`);
      addToast('success', protectMode === 'encrypt' ? 'PDF Protected' : 'Password Removed', protectMode === 'encrypt' ? 'AES-256 password protection added.' : 'The unlocked PDF has been downloaded.');
    } catch (err: any) {
      addToast('error', 'Protection error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWatermarkAction = async () => {
    if (!watermarkFile || !watermarkText) return;
    try {
      setIsProcessing(true);
      const stamped = await applyWatermark(watermarkFile.bytes, watermarkText);
      downloadPdf(stamped, `pdfora_watermarked_${watermarkFile.name}`);
      addToast('success', 'Watermark Stamped', `Applied "${watermarkText}" across all pages.`);
    } catch (err: any) {
      addToast('error', 'Watermark error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePdfToImagesAction = async () => {
    if (!pdfToImgFile) return;
    try {
      setIsProcessing(true);
      const images = await pdfPagesToImages(pdfToImgFile.bytes, pdfImageFormat, 2);
      for (const image of images) downloadBlob(image.blob, `${pdfToImgFile.name.replace(/\.pdf$/i, '')}_${image.name}`);
      addToast('success', 'Images Created', `${images.length} page${images.length > 1 ? 's' : ''} downloaded.`);
    } catch (err: any) {
      addToast('error', 'PDF to image error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOrganizeAction = async () => {
    if (!organizeFile) return;
    try {
      setIsProcessing(true);
      const indices = organizeOrder.split(',').map((value) => Number(value.trim()) - 1);
      if (!indices.length || indices.some((index) => !Number.isInteger(index) || index < 0 || index >= organizeFile.pageCount)) throw new Error(`Use page numbers from 1 to ${organizeFile.pageCount}, separated by commas.`);
      if (new Set(indices).size !== indices.length) throw new Error('Duplicate pages are not allowed.');
      if (indices.length !== organizeFile.pageCount && !window.confirm('Some pages will be omitted or deleted. Download the organized PDF?')) return;
      const result = await reorderPdfPages(organizeFile.bytes, indices);
      downloadPdf(result, `pdfora_organized_${organizeFile.name}`);
      addToast('success', 'Pages Organized', 'The reordered PDF has been downloaded.');
    } catch (err: any) {
      addToast('error', 'Organize error', err.message);
    } finally { setIsProcessing(false); }
  };

  const handleImagesToPdfAction = async () => {
    if (imageFiles.length === 0) return;
    try {
      setIsProcessing(true);
      const pdfBytes = await imagesToPdf(imageFiles);
      downloadPdf(pdfBytes, 'pdfora_compiled_images.pdf');
      addToast('success', 'PDF Created from Images!', `${imageFiles.length} images compiled.`);
    } catch (err: any) {
      addToast('error', 'Image to PDF error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 p-6 flex flex-col items-center">
      <div className="max-w-5xl w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>PDFora Dedicated Tool Suite</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            High-Performance PDF Utilities
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero limits • 100% Client-Side Privacy • No uploads to external servers
          </p>
        </div>

        {/* Tool Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 justify-center scrollbar-none">
          {toolsMenu.map((t) => {
            const isActive = currentTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setCurrentTool(t.id);
                  setActiveTool(t.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tool Panel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          
          {/* ===================== MERGE TOOL ===================== */}
          {currentTool === 'merge' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <span>Merge Multiple PDF Documents</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Combine two or more PDF files into a single master document.
                  </p>
                </div>
                <button
                  onClick={loadSampleForMerge}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample PDFs</span>
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div
                onClick={() => mergeInputRef.current?.click()}
                onDragEnter={(event) => handleDragEnter(event, 'merge')}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDragActiveTool(null);
                  void addMergeFiles(event.dataTransfer.files);
                }}
                className={`p-6 rounded-2xl border-2 border-dashed ${dragActiveTool === 'merge' ? 'border-brand-400 bg-brand-500/10 scale-[1.01]' : 'border-slate-700 hover:border-brand-500 bg-slate-950/60'} flex flex-col items-center justify-center cursor-pointer transition-all group`}
              >
                <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-brand-400 mb-2 transition-colors" />
                <span className="text-xs font-semibold text-white">
                  {dragActiveTool === 'merge' ? 'Drop PDF files here' : 'Drag & drop or click to select PDF files'}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Select multiple files simultaneously
                </span>
                <input
                  ref={mergeInputRef}
                  type="file"
                  multiple
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) void addMergeFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* File List */}
              {mergeFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">
                    Files to combine ({mergeFiles.length}):
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {mergeFiles.map((f, idx) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded bg-brand-500/10 text-brand-400 font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-white truncate max-w-xs">{f.name}</span>
                          <span className="text-slate-500 text-[11px]">({f.size})</span>
                        </div>
                        <button
                          onClick={() => setMergeFiles((prev) => prev.filter((item) => item.id !== f.id))}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  disabled={mergeFiles.length < 2 || isProcessing}
                  onClick={handleMergeAction}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{isProcessing ? 'Merging PDFs...' : 'Merge & Download'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================== SPLIT TOOL ===================== */}
          {currentTool === 'split' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-sky-400" />
                  <span>Split & Extract Pages</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Isolate specific page ranges or extract individual pages into separate files.
                </p>
              </div>

              {!splitFile ? (
                <div
                  onDragEnter={(event) => handleDragEnter(event, 'split')}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={(event) => {
                    event.preventDefault(); setDragActiveTool(null);
                    const file = event.dataTransfer.files?.[0]; if (file) void loadSinglePdf(file, 'split');
                  }}
                  className={`p-8 rounded-2xl border-2 border-dashed ${dragActiveTool === 'split' ? 'border-brand-400 bg-brand-500/10' : 'border-slate-700 bg-slate-950/60'} flex flex-col items-center justify-center transition-all`}
                >
                  <UploadCloud className="w-10 h-10 text-slate-500 mb-2" />
                  <span className="text-xs font-semibold text-white mb-3">{dragActiveTool === 'split' ? 'Drop PDF here' : 'Drag & drop PDF here or select a file'}</span>
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors">
                    <span>Select PDF File</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const buf = await file.arrayBuffer();
                          const uint8 = new Uint8Array(buf);
                          const meta = await getPdfMetadata(uint8);
                          setSplitFile({ name: file.name, bytes: uint8, pageCount: meta.pageCount });
                        }
                      }}
                    />
                  </label>
                  <button
                    onClick={async () => {
                      const s = await createSamplePDF('PDFora Split Sample');
                      setSplitFile({ name: 'Sample_MultiPage.pdf', bytes: s, pageCount: 2 });
                    }}
                    className="mt-3 text-xs text-amber-400 hover:underline"
                  >
                    Or test with sample 2-page document
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">{splitFile.name}</div>
                      <div className="text-[11px] text-slate-400">{splitFile.pageCount} total pages detected</div>
                    </div>
                    <button
                      onClick={() => setSplitFile(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Change File
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Pages to extract (e.g. "1" or "1-2" or "1,2"):
                    </label>
                    <input
                      type="text"
                      value={splitRange}
                      onChange={(e) => setSplitRange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-800">
                    <button
                      onClick={handleSplitAction}
                      disabled={isProcessing}
                      className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isProcessing ? 'Extracting...' : 'Extract & Download'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== COMPRESS TOOL ===================== */}
          {currentTool === 'compress' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Minimize2 className="w-5 h-5 text-violet-400" />
                  <span>Compress PDF File Size</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Re-encode and compress PDF streams to dramatically reduce file weight without losing legibility.
                </p>
              </div>

              {!compressFile ? (
                <div
                  onDragEnter={(event) => handleDragEnter(event, 'compress')}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={(event) => {
                    event.preventDefault(); setDragActiveTool(null);
                    const file = event.dataTransfer.files?.[0]; if (file) void loadSinglePdf(file, 'compress');
                  }}
                  className={`p-8 rounded-2xl border-2 border-dashed ${dragActiveTool === 'compress' ? 'border-brand-400 bg-brand-500/10' : 'border-slate-700 bg-slate-950/60'} flex flex-col items-center justify-center transition-all`}
                >
                  <UploadCloud className="w-10 h-10 text-slate-500 mb-2" />
                  <span className="text-xs font-semibold text-white mb-3">{dragActiveTool === 'compress' ? 'Drop PDF here' : 'Drag & drop PDF here or select a file'}</span>
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors">
                    <span>Choose PDF to Compress</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const buf = await file.arrayBuffer();
                          setCompressFile({
                            name: file.name,
                            size: file.size,
                            bytes: new Uint8Array(buf),
                          });
                        }
                      }}
                    />
                  </label>
                  <button
                    onClick={async () => {
                      const s = await createSamplePDF('Compress Test Document');
                      setCompressFile({ name: 'Sample_Executive.pdf', size: 145000, bytes: s });
                    }}
                    className="mt-3 text-xs text-amber-400 hover:underline"
                  >
                    Or test with pre-loaded document
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">{compressFile.name}</div>
                      <div className="text-[11px] text-slate-400">
                        Original size: {(compressFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button onClick={() => setCompressFile(null)} className="text-xs text-slate-400 hover:text-white">
                      Change File
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      Compression Profile:
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'low', label: 'Basic Compression', desc: 'Highest quality image fidelity' },
                        { id: 'recommended', label: 'Recommended', desc: 'Optimal balance of size & sharpness' },
                        { id: 'extreme', label: 'Extreme Reduction', desc: 'Smallest size for email transmission' },
                      ].map((lvl) => (
                        <div
                          key={lvl.id}
                          onClick={() => setCompressionLevel(lvl.id as any)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            compressionLevel === lvl.id
                              ? 'border-brand-500 bg-brand-500/10'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold text-white mb-0.5">{lvl.label}</div>
                          <div className="text-[10px] text-slate-400 leading-tight">{lvl.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {compressedResult && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-emerald-300">
                          Reduced by {compressedResult.savedPercent}%!
                        </div>
                        <div className="text-[11px] text-emerald-400/80">
                          New estimated size: {(compressedResult.newSize / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-3 border-t border-slate-800">
                    <button
                      onClick={handleCompressAction}
                      disabled={isProcessing}
                      className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isProcessing ? 'Optimizing...' : 'Compress & Download'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== ROTATE TOOL ===================== */}
          {currentTool === 'rotate' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-amber-400" />
                  <span>Rotate PDF Pages</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Orient sideways scans or flip documents permanently in bulk.
                </p>
              </div>

              {!rotateFile ? (
                <div
                  onDragEnter={(event) => handleDragEnter(event, 'rotate')}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={(event) => {
                    event.preventDefault(); setDragActiveTool(null);
                    const file = event.dataTransfer.files?.[0]; if (file) void loadSinglePdf(file, 'rotate');
                  }}
                  className={`p-8 rounded-2xl border-2 border-dashed ${dragActiveTool === 'rotate' ? 'border-brand-400 bg-brand-500/10' : 'border-slate-700 bg-slate-950/60'} flex flex-col items-center justify-center transition-all`}
                >
                  <UploadCloud className="w-10 h-10 text-slate-500 mb-2" />
                  <span className="text-xs font-semibold text-white mb-3">{dragActiveTool === 'rotate' ? 'Drop PDF here' : 'Drag & drop PDF here or select a file'}</span>
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors">
                    <span>Choose PDF to Rotate</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const buf = await file.arrayBuffer();
                          const uint8 = new Uint8Array(buf);
                          const meta = await getPdfMetadata(uint8);
                          setRotateFile({ name: file.name, bytes: uint8, pageCount: meta.pageCount });
                        }
                      }}
                    />
                  </label>
                  <button
                    onClick={async () => {
                      const s = await createSamplePDF('Rotate Test Document');
                      setRotateFile({ name: 'Sample_Brief.pdf', bytes: s, pageCount: 2 });
                    }}
                    className="mt-3 text-xs text-amber-400 hover:underline"
                  >
                    Or test with sample PDF
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">{rotateFile.name}</div>
                      <div className="text-[11px] text-slate-400">{rotateFile.pageCount} pages</div>
                    </div>
                    <button onClick={() => setRotateFile(null)} className="text-xs text-slate-400 hover:text-white">
                      Change File
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-300">Rotation Angle:</span>
                    {[90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => setBatchRotation(deg)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          batchRotation === deg
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        +{deg}° Clockwise
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-800">
                    <button
                      onClick={handleRotateAction}
                      disabled={isProcessing}
                      className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isProcessing ? 'Rotating...' : 'Rotate & Download'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== PROTECT & ENCRYPT ===================== */}
          {currentTool === 'protect' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <span>Protect & Secure Document</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Apply password protection and prevent unauthorized tampering or copying.
                </p>
              </div>

              {!protectFile ? (
                <div
                  onDragEnter={(event) => handleDragEnter(event, 'protect')}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={(event) => {
                    event.preventDefault(); setDragActiveTool(null);
                    const file = event.dataTransfer.files?.[0]; if (file) void loadSinglePdf(file, 'protect');
                  }}
                  className={`p-8 rounded-2xl border-2 border-dashed ${dragActiveTool === 'protect' ? 'border-brand-400 bg-brand-500/10' : 'border-slate-700 bg-slate-950/60'} flex flex-col items-center justify-center transition-all`}
                >
                  <UploadCloud className="w-10 h-10 text-slate-500 mb-2" />
                  <span className="text-xs font-semibold text-white mb-3">{dragActiveTool === 'protect' ? 'Drop PDF here' : 'Drag & drop PDF here or select a file'}</span>
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors">
                    <span>Select PDF to Protect</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const buf = await file.arrayBuffer();
                          setProtectFile({ name: file.name, bytes: new Uint8Array(buf) });
                        }
                      }}
                    />
                  </label>
                  <button
                    onClick={async () => {
                      const s = await createSamplePDF('Confidential Audit');
                      setProtectFile({ name: 'Confidential_Audit.pdf', bytes: s });
                    }}
                    className="mt-3 text-xs text-amber-400 hover:underline"
                  >
                    Or test with sample confidential PDF
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{protectFile.name}</span>
                    <button onClick={() => setProtectFile(null)} className="text-xs text-slate-400 hover:text-white">
                      Change File
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => setProtectMode('encrypt')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${protectMode === 'encrypt' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Add Password</button>
                    <button onClick={() => setProtectMode('decrypt')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${protectMode === 'decrypt' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Remove Password</button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {protectMode === 'encrypt' ? 'Set Document Password:' : 'Enter Current Password:'}
                    </label>
                    <input
                      type="password"
                      value={protectPassword}
                      onChange={(e) => setProtectPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-800">
                    <button
                      onClick={handleProtectAction}
                      disabled={isProcessing || !protectPassword}
                      className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{isProcessing ? (protectMode === 'encrypt' ? 'Securing...' : 'Unlocking...') : (protectMode === 'encrypt' ? 'Encrypt & Download' : 'Remove Password & Download')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== WATERMARK TOOL ===================== */}
          {currentTool === 'watermark' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <span>Watermark & Stamp Document</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Stamp custom diagonal text badges across all pages of your PDF.
                </p>
              </div>

              {!watermarkFile ? (
                <div
                  onDragEnter={(event) => handleDragEnter(event, 'watermark')}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={(event) => {
                    event.preventDefault(); setDragActiveTool(null);
                    const file = event.dataTransfer.files?.[0]; if (file) void loadSinglePdf(file, 'watermark');
                  }}
                  className={`p-8 rounded-2xl border-2 border-dashed ${dragActiveTool === 'watermark' ? 'border-brand-400 bg-brand-500/10' : 'border-slate-700 bg-slate-950/60'} flex flex-col items-center justify-center transition-all`}
                >
                  <UploadCloud className="w-10 h-10 text-slate-500 mb-2" />
                  <span className="text-xs font-semibold text-white mb-3">{dragActiveTool === 'watermark' ? 'Drop PDF here' : 'Drag & drop PDF here or select a file'}</span>
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors">
                    <span>Select PDF to Watermark</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const buf = await file.arrayBuffer();
                          setWatermarkFile({ name: file.name, bytes: new Uint8Array(buf) });
                        }
                      }}
                    />
                  </label>
                  <button
                    onClick={async () => {
                      const s = await createSamplePDF('Watermark Sample Brief');
                      setWatermarkFile({ name: 'PDFora_Document.pdf', bytes: s });
                    }}
                    className="mt-3 text-xs text-amber-400 hover:underline"
                  >
                    Or test with sample PDF
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{watermarkFile.name}</span>
                    <button onClick={() => setWatermarkFile(null)} className="text-xs text-slate-400 hover:text-white">
                      Change File
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Watermark Stamp Text:
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-800">
                    <button
                      onClick={handleWatermarkAction}
                      disabled={isProcessing || !watermarkText}
                      className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isProcessing ? 'Stamping...' : 'Apply & Download'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== ORGANIZE PAGES ===================== */}
          {currentTool === 'organize' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4"><h2 className="text-lg font-bold text-white">Delete or Reorder Pages</h2><p className="text-xs text-slate-400 mt-0.5">Enter a comma-separated page order. Listed pages are kept; omitted pages are deleted.</p></div>
              {!organizeFile ? (
                <label className="p-8 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 flex flex-col items-center justify-center cursor-pointer"><UploadCloud className="w-10 h-10 text-slate-500 mb-2"/><span className="text-xs font-semibold text-white">Choose PDF to organize</span><input type="file" accept="application/pdf,.pdf" className="hidden" onChange={async (e) => {const file=e.target.files?.[0];if(!file)return;try{const bytes=new Uint8Array(await file.arrayBuffer());const meta=await getPdfMetadata(bytes);setOrganizeFile({name:file.name,bytes,pageCount:meta.pageCount});setOrganizeOrder(Array.from({length:meta.pageCount},(_,i)=>i+1).join(','));}catch(err:any){addToast('error','Could not read PDF',err.message)}}}/></label>
              ) : (
                <div className="space-y-4"><div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"><div><div className="text-xs font-semibold text-white">{organizeFile.name}</div><div className="text-[11px] text-slate-400">{organizeFile.pageCount} pages</div></div><button onClick={() => setOrganizeFile(null)} className="text-xs text-slate-400">Change File</button></div><label className="block text-xs text-slate-300">Keep and reorder pages<input value={organizeOrder} onChange={(e)=>setOrganizeOrder(e.target.value)} placeholder="3,1,2" className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white" /></label><div className="flex justify-end pt-3 border-t border-slate-800"><button onClick={handleOrganizeAction} disabled={isProcessing || !organizeOrder.trim()} className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs flex items-center gap-2"><Download className="w-4 h-4"/>Organize & Download</button></div></div>
              )}
            </div>
          )}

          {/* ===================== PDF TO IMAGES ===================== */}
          {currentTool === 'pdf-to-img' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white">Convert PDF to Images</h2>
                <p className="text-xs text-slate-400 mt-0.5">Download every page as a high-resolution PNG or JPEG.</p>
              </div>
              {!pdfToImgFile ? (
                <label className="p-8 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 flex flex-col items-center justify-center cursor-pointer">
                  <UploadCloud className="w-10 h-10 text-slate-500 mb-2" />
                  <span className="text-xs font-semibold text-white">Choose PDF to convert</span>
                  <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    try { const bytes = new Uint8Array(await file.arrayBuffer()); const meta = await getPdfMetadata(bytes); setPdfToImgFile({ name: file.name, bytes, pageCount: meta.pageCount }); } catch (err: any) { addToast('error', 'Could not read PDF', err.message); }
                  }} />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"><div><div className="text-xs font-semibold text-white">{pdfToImgFile.name}</div><div className="text-[11px] text-slate-400">{pdfToImgFile.pageCount} pages</div></div><button onClick={() => setPdfToImgFile(null)} className="text-xs text-slate-400">Change File</button></div>
                  <div className="flex gap-2"><button onClick={() => setPdfImageFormat('png')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${pdfImageFormat === 'png' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'}`}>PNG</button><button onClick={() => setPdfImageFormat('jpeg')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${pdfImageFormat === 'jpeg' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'}`}>JPEG</button></div>
                  <div className="flex justify-end pt-3 border-t border-slate-800"><button onClick={handlePdfToImagesAction} disabled={isProcessing} className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs flex items-center gap-2"><Download className="w-4 h-4" />{isProcessing ? 'Converting...' : 'Convert & Download'}</button></div>
                </div>
              )}
            </div>
          )}

          {/* ===================== IMAGE TO PDF TOOL ===================== */}
          {currentTool === 'img-to-pdf' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-fuchsia-400" />
                  <span>Images to PDF Converter</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compile JPEG and PNG graphics into a standardized multi-page PDF publication.
                </p>
              </div>

              <div
                onClick={() => imgInputRef.current?.click()}
                onDragEnter={(event) => handleDragEnter(event, 'img-to-pdf')}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDragActiveTool(null);
                  addImageFiles(event.dataTransfer.files);
                }}
                className={`p-8 rounded-2xl border-2 border-dashed ${dragActiveTool === 'img-to-pdf' ? 'border-brand-400 bg-brand-500/10 scale-[1.01]' : 'border-slate-700 hover:border-brand-500 bg-slate-950/60'} flex flex-col items-center justify-center cursor-pointer transition-all group`}
              >
                <ImageIcon className="w-10 h-10 text-slate-500 group-hover:text-brand-400 mb-2 transition-colors" />
                <span className="text-xs font-semibold text-white">{dragActiveTool === 'img-to-pdf' ? 'Drop images here' : 'Drag & drop or click to select images (PNG, JPG)'}</span>
                <input
                  ref={imgInputRef}
                  type="file"
                  multiple
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) addImageFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>

              {imageFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {imageFiles.map((img, idx) => (
                    <div
                      key={img.id}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 relative group overflow-hidden"
                    >
                      <img src={img.dataUrl} alt={img.name} className="w-full h-24 object-cover rounded-lg mb-1" />
                      <div className="text-[10px] text-slate-400 truncate">{img.name}</div>
                      <button
                        onClick={() => setImageFiles((prev) => prev.filter((item) => item.id !== img.id))}
                        className="absolute top-3 right-3 bg-rose-600 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  onClick={handleImagesToPdfAction}
                  disabled={imageFiles.length === 0 || isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isProcessing ? 'Generating PDF...' : 'Convert to PDF'}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

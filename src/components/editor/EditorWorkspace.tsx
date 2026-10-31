import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Type, 
  PenTool, 
  ShieldAlert, 
  Download, 
  Save, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  UploadCloud, 
  Sparkles, 
  Maximize2, 
  CheckCircle2, 
  FileText,
  BadgeCheck,
  MousePointer,
  X,
  Layers,
  Highlighter,
  Underline,
  StickyNote,
  Square,
  Circle,
  Minus,
  Undo2,
  Redo2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDocument } from '../../context/DocumentContext';
import { renderPageToCanvas, burnAnnotationsIntoPdf, downloadPdf } from '../../services/pdfService';
import { SignatureModal } from './SignatureModal';
import { WatermarkModal } from './WatermarkModal';
import { Annotation } from '../../types';

const PageThumbnail: React.FC<{ pdfBytes: Uint8Array; pageNumber: number; rotation: number }> = ({
  pdfBytes,
  pageNumber,
  rotation,
}) => {
  const thumbnailRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (!thumbnailRef.current) return;
    void renderPageToCanvas(pdfBytes, pageNumber, thumbnailRef.current, 0.28, rotation)
      .catch((error) => {
        if (!cancelled) console.error(`Failed to render thumbnail ${pageNumber}:`, error);
      });
    return () => { cancelled = true; };
  }, [pdfBytes, pageNumber, rotation]);

  return (
    <canvas
      ref={thumbnailRef}
      className="w-full aspect-[3/4] bg-white rounded shadow-sm block"
    />
  );
};

export const EditorWorkspace: React.FC = () => {
  const {
    pdfBytes,
    pdfFileName,
    pageCount,
    currentPage,
    setCurrentPage,
    zoomLevel,
    setZoomLevel,
    annotations,
    addAnnotation,
    removeAnnotation,
    clearAnnotations,
    undo,
    redo,
    canUndo,
    canRedo,
    pageRotations,
    rotatePage,
    loadSampleDocument,
    loadPdfFromBuffer,
    saveCurrentToVault,
    addToast,
    isLoadingPdf
  } = useDocument();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeToolMode, setActiveToolMode] = useState<'select' | 'text' | 'stamp' | 'draw' | 'highlight' | 'underline' | 'sticky' | 'rect' | 'ellipse' | 'line'>('select');
  const [selectedStamp, setSelectedStamp] = useState<string>('APPROVED');
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [textInputVal, setTextInputVal] = useState('Type annotation...');
  const [isDragActive, setIsDragActive] = useState(false);
  const [viewportVersion, setViewportVersion] = useState(0);
  const drawingRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);

  // Current page rotation
  const currentRotation = pageRotations[currentPage - 1] || 0;

  useEffect(() => {
    let frame = 0;
    const handleResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => setViewportVersion((value) => value + 1));
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Render current page onto canvas whenever page, zoom, or rotation changes
  useEffect(() => {
    if (!pdfBytes || !canvasRef.current) return;
    let isCancelled = false;

    const render = async () => {
      try {
        if (canvasRef.current) {
          await renderPageToCanvas(
            pdfBytes,
            currentPage,
            canvasRef.current,
            zoomLevel * 1.5,
            currentRotation
          );
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Canvas render error:', err);
        }
      }
    };

    render();
    return () => {
      isCancelled = true;
    };
  }, [pdfBytes, currentPage, zoomLevel, currentRotation, viewportVersion]);

  // Handle clicking on page canvas to place annotations
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeToolMode === 'select') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeToolMode === 'text') {
      addAnnotation({
        pageNumber: currentPage,
        type: 'text',
        x: Math.round(x),
        y: Math.round(y),
        content: textInputVal || 'Sample Note',
        fontSize: 16,
      });
      setActiveToolMode('select');
    } else if (activeToolMode === 'stamp') {
      addAnnotation({ pageNumber: currentPage, type: 'stamp', x: Math.round(x), y: Math.round(y), content: selectedStamp });
      setActiveToolMode('select');
    } else if (['highlight', 'underline', 'rect', 'ellipse', 'line', 'sticky'].includes(activeToolMode)) {
      addAnnotation({
        pageNumber: currentPage,
        type: activeToolMode as Annotation['type'],
        x: Math.round(x),
        y: Math.round(y),
        width: activeToolMode === 'underline' || activeToolMode === 'highlight' ? 24 : 12,
        height: activeToolMode === 'underline' || activeToolMode === 'highlight' ? 3 : 8,
        content: activeToolMode === 'sticky' ? 'New note' : undefined,
        color: activeToolMode === 'highlight' ? '#facc15' : '#ef4444',
        opacity: activeToolMode === 'highlight' ? 0.35 : 1,
      });
      setActiveToolMode('select');
    }
  };

  const getCanvasPoint = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activeToolMode !== 'draw') return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    isDrawingRef.current = true;
    drawingRef.current = [getCanvasPoint(event)];
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingRef.current || activeToolMode !== 'draw') return;
    const point = getCanvasPoint(event);
    const last = drawingRef.current[drawingRef.current.length - 1];
    if (!last || Math.hypot(point.x - last.x, point.y - last.y) >= 0.5) drawingRef.current.push(point);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingRef.current || activeToolMode !== 'draw') return;
    isDrawingRef.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (drawingRef.current.length > 1) {
      addAnnotation({ pageNumber: currentPage, type: 'draw', x: 0, y: 0, points: drawingRef.current, color: '#ef4444', fontSize: 3, opacity: 1 });
    }
    drawingRef.current = [];
  };

  const handleSaveSignature = (sigDataUrl: string) => {
    addAnnotation({
      pageNumber: currentPage,
      type: 'signature',
      x: 35,
      y: 65,
      width: 160,
      height: 65,
      content: sigDataUrl,
    });
    addToast('success', 'Signature Placed', `Signature added to Page ${currentPage}. Click to drag or adjust.`);
  };

  // Export & Download PDF with permanently burned annotations & rotations
  const handleExport = async () => {
    if (!pdfBytes) return;
    try {
      setIsExporting(true);
      const outputBytes = await burnAnnotationsIntoPdf(pdfBytes, annotations, pageRotations);
      const downloadName = pdfFileName.replace(/\.pdf$/i, '_pdfora_edited.pdf');
      downloadPdf(outputBytes, downloadName);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#3352eb', '#10b981', '#f59e0b', '#ec4899'],
      });

      addToast('success', 'Document Exported!', `Downloaded as ${downloadName} with vector layers.`);
    } catch (err: any) {
      console.error('Export error:', err);
      addToast('error', 'Export Failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const openPdfFile = async (file?: File) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      addToast('error', 'Invalid file type', 'Please drop a PDF file only.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      await loadPdfFromBuffer(buffer, file.name);
    } catch (error: any) {
      addToast('error', 'Could not open PDF', error?.message || 'Please choose a valid PDF file.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    void openPdfFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) setIsDragActive(false);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    void openPdfFile(event.dataTransfer.files?.[0]);
  };

  // Current page annotations
  const pageAnnotations = annotations.filter((a) => a.pageNumber === currentPage);

  // If no document is open yet, show empty state prompt
  if (!pdfBytes) {
    return (
      <div className="flex-1 min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-slate-950 bg-grid-pattern">
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`max-w-md w-full p-8 rounded-3xl border-2 bg-slate-900/80 backdrop-blur-xl text-center shadow-2xl transition-all ${isDragActive ? 'border-brand-400 bg-brand-500/10 scale-[1.01]' : 'border-slate-800'}`}
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mx-auto mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Document Open</h2>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Drag & drop a PDF anywhere in this panel, upload one from your computer, or launch our interactive sample.
          </p>

          {isDragActive && (
            <div className="mb-4 py-3 rounded-xl border border-brand-400/40 bg-brand-500/10 text-xs font-bold text-brand-300">
              Drop PDF to open in editor
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload PDF Document</span>
            </button>

            <button
              onClick={loadSampleDocument}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Open Sample PDF</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex flex-col h-[calc(100vh-64px)] bg-slate-950 select-none overflow-hidden transition-all ${isDragActive ? 'ring-2 ring-inset ring-brand-400' : ''}`}
    >
      {isDragActive && (
        <div className="absolute inset-0 z-50 m-4 rounded-2xl border-2 border-dashed border-brand-400 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-brand-500/15 border border-brand-400/40 text-brand-300 font-bold text-sm shadow-2xl">
            <UploadCloud className="w-5 h-5" />
            Drop PDF to switch files
          </div>
        </div>
      )}

      {/* Top Workspace Toolbar */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between shrink-0 gap-2 z-20">
        
        {/* Left: Document Name & File Switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <span className="text-xs font-semibold text-white truncate block max-w-[160px] md:max-w-[240px]">
              {pdfFileName}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {pageCount} Pages • Client Vector Engine
            </span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Open another PDF"
            className="text-[11px] text-brand-400 hover:text-brand-300 px-2 py-1 rounded bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 transition-colors shrink-0"
          >
            Switch File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Center: Interactive Annotation Tools */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          
          {/* Select Mode */}
          <button
            onClick={() => setActiveToolMode('select')}
            title="Pointer / Pan Tool"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeToolMode === 'select'
                ? 'bg-brand-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Pointer</span>
          </button>

          {/* Add Text */}
          <button
            onClick={() => setActiveToolMode('text')}
            title="Click anywhere on canvas to place text"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeToolMode === 'text'
                ? 'bg-brand-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Add Text</span>
          </button>

          <button onClick={() => setActiveToolMode('draw')} title="Draw with mouse, pen, or stylus" className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${activeToolMode === 'draw' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}><PenTool className="w-3.5 h-3.5" /><span className="hidden xl:inline">Pen</span></button>
          <button onClick={() => setActiveToolMode('highlight')} title="Highlight text" className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${activeToolMode === 'highlight' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}><Highlighter className="w-3.5 h-3.5" /><span className="hidden xl:inline">Highlight</span></button>
          <button onClick={() => setActiveToolMode('underline')} title="Underline text" className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${activeToolMode === 'underline' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}><Underline className="w-3.5 h-3.5" /><span className="hidden xl:inline">Underline</span></button>
          <button onClick={() => setActiveToolMode('sticky')} title="Place sticky note" className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${activeToolMode === 'sticky' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}><StickyNote className="w-3.5 h-3.5" /><span className="hidden xl:inline">Note</span></button>
          <button onClick={() => setActiveToolMode('rect')} title="Rectangle" className={`px-2 py-1 rounded-lg transition-colors ${activeToolMode === 'rect' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}><Square className="w-3.5 h-3.5" /></button>
          <button onClick={() => setActiveToolMode('ellipse')} title="Ellipse" className={`px-2 py-1 rounded-lg transition-colors ${activeToolMode === 'ellipse' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}><Circle className="w-3.5 h-3.5" /></button>
          <button onClick={() => setActiveToolMode('line')} title="Line" className={`px-2 py-1 rounded-lg transition-colors ${activeToolMode === 'line' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}><Minus className="w-3.5 h-3.5" /></button>

          {/* Add Stamp */}
          <div className="flex items-center">
            <button
              onClick={() => setActiveToolMode('stamp')}
              title="Click on canvas to place stamp"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeToolMode === 'stamp'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Stamp: {selectedStamp}</span>
            </button>
            {activeToolMode === 'stamp' && (
              <select
                value={selectedStamp}
                onChange={(e) => setSelectedStamp(e.target.value)}
                className="bg-slate-900 text-white text-[10px] rounded px-1.5 py-1 border border-slate-700 ml-1"
              >
                <option value="APPROVED">APPROVED</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="VOID">VOID</option>
                <option value="REVIEWED">REVIEWED</option>
              </select>
            )}
          </div>

          {/* Sign PDF */}
          <button
            onClick={() => setIsSigModalOpen(true)}
            title="Open digital signature canvas"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors"
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Sign</span>
          </button>

          {/* Watermark */}
          <button
            onClick={() => setIsWatermarkModalOpen(true)}
            title="Apply diagonal text watermark"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Watermark</span>
          </button>

          {/* Rotate Current Page */}
          <button
            onClick={() => rotatePage(currentPage - 1, 90)}
            title="Rotate current page 90 degrees"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Save to Vault & Export */}
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={!canUndo} title="Undo" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"><Undo2 className="w-4 h-4" /></button>
          <button onClick={redo} disabled={!canRedo} title="Redo" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"><Redo2 className="w-4 h-4" /></button>
          <button
            onClick={() => saveCurrentToVault()}
            title="Save into My Documents"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:flex items-center gap-1 text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-brand-600/30 flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>

      </div>

      {/* Workspace Sub-bar: Zoom, Page Controls, Active Tool Tip */}
      <div className="h-10 border-b border-slate-800/80 bg-slate-900/50 px-4 flex items-center justify-between text-xs text-slate-400 shrink-0">
        
        {/* Left: Active Tool Notification */}
        <div className="flex items-center gap-2">
          {activeToolMode !== 'select' ? (
            <span className="text-[11px] text-amber-400 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Click on the document page below to place your {activeToolMode}.
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 hidden sm:block">
              Double-click any annotation to remove it.
            </span>
          )}
        </div>

        {/* Center: Page Switcher */}
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium text-slate-200">
            Page {currentPage} of {pageCount}
          </span>
          <button
            disabled={currentPage >= pageCount}
            onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomLevel((prev) => Math.max(0.6, prev - 0.15))}
            className="p-1 rounded hover:bg-slate-800 text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono w-12 text-center text-slate-300">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.15))}
            className="p-1 rounded hover:bg-slate-800 text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1.0)}
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white ml-1"
          >
            Reset
          </button>
        </div>

      </div>

      {/* Main Content Area: Sidebar + Canvas Viewport */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Page Thumbnails Strip */}
        <aside className="w-44 border-r border-slate-800/80 bg-slate-900/30 overflow-y-auto p-3 hidden md:flex flex-col gap-3 shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 mb-1">
            Pages ({pageCount})
          </div>

          {Array.from({ length: pageCount }).map((_, i) => {
            const pageNum = i + 1;
            const isSelected = currentPage === pageNum;
            const rot = pageRotations[i] || 0;

            return (
              <div
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 shadow-glow'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="w-full aspect-[3/4] bg-white rounded shadow-sm flex items-center justify-center relative overflow-hidden mb-1.5">
                  <PageThumbnail pdfBytes={pdfBytes} pageNumber={pageNum} rotation={rot} />
                  {rot > 0 && (
                    <div className="absolute top-1 right-1 bg-brand-600 text-white text-[8px] font-bold px-1 rounded">
                      {rot}°
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>Page {pageNum}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      rotatePage(i, 90);
                    }}
                    title="Rotate page 90°"
                    className="hover:text-white p-0.5 rounded"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </aside>

        {/* Center Canvas Viewport */}
        <main
          ref={containerRef}
          className="flex-1 bg-slate-950 overflow-auto p-6 flex justify-center items-start"
        >
          <div
            onClick={handleCanvasClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className={`relative bg-white shadow-2xl rounded-sm transition-all ${
              activeToolMode !== 'select' ? 'cursor-crosshair ring-2 ring-brand-500' : 'cursor-default'
            }`}
          >
            {/* Real HTML5 Canvas from PDF.js */}
            <canvas ref={canvasRef} className="block pointer-events-none" />

            {/* Interactive Annotation Overlay Layer */}
            <div className="absolute inset-0 pointer-events-none">
              {pageAnnotations.map((ann) => {
                if (ann.type === 'text') {
                  return (
                    <div
                      key={ann.id}
                      style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        removeAnnotation(ann.id);
                      }}
                      title="Double-click to delete"
                      className="absolute pointer-events-auto cursor-move bg-brand-50/90 text-slate-900 border border-brand-400 rounded px-2 py-1 text-xs font-semibold shadow-md group select-none"
                    >
                      <span>{ann.content}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnnotation(ann.id);
                        }}
                        className="ml-2 text-rose-500 hover:text-rose-700 text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  );
                }

                if (ann.type === 'stamp') {
                  return (
                    <div
                      key={ann.id}
                      style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        removeAnnotation(ann.id);
                      }}
                      title="Double-click to delete"
                      className="absolute pointer-events-auto cursor-move border-2 border-rose-600 bg-rose-50/80 text-rose-600 px-3 py-1 font-black text-xs tracking-wider rounded uppercase shadow group select-none -rotate-6"
                    >
                      <span>{ann.content}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnnotation(ann.id);
                        }}
                        className="ml-2 text-rose-800 text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  );
                }

                if (ann.type === 'signature' && ann.content) {
                  return (
                    <div
                      key={ann.id}
                      style={{
                        left: `${ann.x}%`,
                        top: `${ann.y}%`,
                        width: `${ann.width || 150}px`,
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        removeAnnotation(ann.id);
                      }}
                      title="Double-click to delete signature"
                      className="absolute pointer-events-auto cursor-move p-1 border border-brand-400/60 bg-white/60 backdrop-blur-[2px] rounded group shadow-md"
                    >
                      <img
                        src={ann.content}
                        alt="Signature"
                        className="w-full h-auto pointer-events-none"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnnotation(ann.id);
                        }}
                        className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  );
                }

                return null;
              })}
            </div>

          </div>
        </main>

      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSigModalOpen}
        onClose={() => setIsSigModalOpen(false)}
        onSaveSignature={handleSaveSignature}
      />

      {/* Watermark Modal */}
      <WatermarkModal
        isOpen={isWatermarkModalOpen}
        onClose={() => setIsWatermarkModalOpen(false)}
      />

    </div>
  );
};

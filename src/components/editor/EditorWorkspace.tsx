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
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDocument } from '../../context/DocumentContext';
import { renderPageToCanvas, burnAnnotationsIntoPdf, downloadPdf } from '../../services/pdfService';
import { SignatureModal } from './SignatureModal';
import { WatermarkModal } from './WatermarkModal';
import { Annotation } from '../../types';

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

  const [activeToolMode, setActiveToolMode] = useState<'select' | 'text' | 'stamp'>('select');
  const [selectedStamp, setSelectedStamp] = useState<string>('APPROVED');
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [textInputVal, setTextInputVal] = useState('Type annotation...');

  // Current page rotation
  const currentRotation = pageRotations[currentPage - 1] || 0;

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
  }, [pdfBytes, currentPage, zoomLevel, currentRotation]);

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
      addAnnotation({
        pageNumber: currentPage,
        type: 'stamp',
        x: Math.round(x),
        y: Math.round(y),
        content: selectedStamp,
      });
      setActiveToolMode('select');
    }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = async () => {
        if (reader.result) {
          await loadPdfFromBuffer(reader.result as ArrayBuffer, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Current page annotations
  const pageAnnotations = annotations.filter((a) => a.pageNumber === currentPage);

  // If no document is open yet, show empty state prompt
  if (!pdfBytes) {
    return (
      <div className="flex-1 min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-slate-950 bg-grid-pattern">
        <div className="max-w-md w-full p-8 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mx-auto mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Document Open</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Upload an existing PDF from your computer or launch our interactive pre-loaded business sample to explore the full editing workspace.
          </p>

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
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 select-none overflow-hidden">
      
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
                  <div
                    style={{ transform: `rotate(${rot}deg)` }}
                    className="text-slate-400 text-[10px] font-bold transition-transform"
                  >
                    Pg {pageNum}
                  </div>
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

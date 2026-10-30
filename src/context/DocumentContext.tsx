import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Annotation, AppView, DocumentItem, PDFPageInfo, ToolType } from '../types';
import { getPdfMetadata, generateThumbnail } from '../services/pdfService';
import { createSamplePDF } from '../services/samplePdfs';
import { storageService } from '../services/storageService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface DocumentContextType {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  activeTool: ToolType | null;
  setActiveTool: (tool: ToolType | null) => void;

  // Active Document In Editor
  pdfBytes: Uint8Array | null;
  pdfFileName: string;
  pageCount: number;
  pagesInfo: PDFPageInfo[];
  currentPage: number;
  setCurrentPage: (p: number) => void;
  zoomLevel: number;
  setZoomLevel: (z: number | ((prev: number) => number)) => void;

  // Annotations & Editor State
  annotations: Annotation[];
  addAnnotation: (ann: Omit<Annotation, 'id'>) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  pageRotations: Record<number, number>; // 0-based page index -> rotation in deg
  rotatePage: (pageIndex: number, degreesToAdd: number) => void;

  // Document management
  documents: DocumentItem[];
  loadPdfFromBuffer: (buffer: Uint8Array | ArrayBuffer, fileName: string) => Promise<void>;
  loadSampleDocument: () => Promise<void>;
  saveCurrentToVault: () => Promise<DocumentItem | null>;
  deleteDocument: (id: string) => void;
  toggleStar: (id: string) => void;

  // Toast notifications
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
  removeToast: (id: string) => void;

  isLoadingPdf: boolean;
  navigateToTool: (tool: ToolType) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('sample-document.pdf');
  const [pageCount, setPageCount] = useState<number>(0);
  const [pagesInfo, setPagesInfo] = useState<PDFPageInfo[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});

  const [documents, setDocuments] = useState<DocumentItem[]>(() => storageService.getDocuments());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadPdfFromBuffer = useCallback(async (buffer: Uint8Array | ArrayBuffer, fileName: string) => {
    try {
      setIsLoadingPdf(true);
      const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      const metadata = await getPdfMetadata(uint8);

      setPdfBytes(uint8);
      setPdfFileName(fileName);
      setPageCount(metadata.pageCount);
      setPagesInfo(metadata.pages);
      setCurrentPage(1);
      setAnnotations([]);
      setPageRotations({});
      setZoomLevel(1.0);

      addToast('success', 'PDF Loaded Successfully', `${fileName} (${metadata.pageCount} pages) ready for editing.`);
    } catch (err: any) {
      console.error('Failed to load PDF buffer:', err);
      addToast('error', 'Error loading PDF', err.message || 'Please check if the file is a valid PDF');
    } finally {
      setIsLoadingPdf(false);
    }
  }, [addToast]);

  const loadSampleDocument = useCallback(async () => {
    try {
      setIsLoadingPdf(true);
      const sample = await createSamplePDF('PDFora Executive Brief');
      await loadPdfFromBuffer(sample, 'PDFora_Executive_Brief.pdf');
      setCurrentView('editor');
    } catch (err: any) {
      addToast('error', 'Could not generate sample PDF', err.message);
    } finally {
      setIsLoadingPdf(false);
    }
  }, [loadPdfFromBuffer, addToast]);

  const addAnnotation = (ann: Omit<Annotation, 'id'>) => {
    const newAnn: Annotation = {
      ...ann,
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setAnnotations(prev => [...prev, newAnn]);
    addToast('info', 'Annotation Added', `Added ${ann.type} to page ${ann.pageNumber}`);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const clearAnnotations = () => {
    setAnnotations([]);
  };

  const rotatePage = (pageIndex: number, degreesToAdd: number) => {
    setPageRotations(prev => {
      const current = prev[pageIndex] || 0;
      return {
        ...prev,
        [pageIndex]: (current + degreesToAdd) % 360,
      };
    });
    addToast('info', 'Page Rotated', `Page ${pageIndex + 1} rotated by ${degreesToAdd}°`);
  };

  const saveCurrentToVault = async (): Promise<DocumentItem | null> => {
    if (!pdfBytes) {
      addToast('warning', 'No document to save');
      return null;
    }

    try {
      let thumb: string | undefined;
      try {
        thumb = await generateThumbnail(pdfBytes, 1);
      } catch {
        thumb = undefined;
      }

      const newDoc: DocumentItem = {
        id: `doc_${Date.now()}`,
        name: pdfFileName,
        sizeBytes: pdfBytes.byteLength,
        pageCount: pageCount || 1,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        thumbnailUrl: thumb,
        tags: ['Edited', 'PDFora Vault'],
        isStarred: true,
      };

      storageService.addDocument(newDoc);
      setDocuments(storageService.getDocuments());
      addToast('success', 'Saved to My Documents', `${pdfFileName} is secured in your local vault.`);
      return newDoc;
    } catch (err: any) {
      addToast('error', 'Failed to save document', err.message);
      return null;
    }
  };

  const deleteDocument = (id: string) => {
    storageService.deleteDocument(id);
    setDocuments(storageService.getDocuments());
    addToast('info', 'Document Removed', 'The file was removed from your vault.');
  };

  const toggleStar = (id: string) => {
    storageService.toggleStarred(id);
    setDocuments(storageService.getDocuments());
  };

  const navigateToTool = (tool: ToolType) => {
    setActiveTool(tool);
    setCurrentView('tools');
  };

  return (
    <DocumentContext.Provider
      value={{
        currentView,
        setCurrentView,
        activeTool,
        setActiveTool,
        pdfBytes,
        pdfFileName,
        pageCount,
        pagesInfo,
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
        documents,
        loadPdfFromBuffer,
        loadSampleDocument,
        saveCurrentToVault,
        deleteDocument,
        toggleStar,
        toasts,
        addToast,
        removeToast,
        isLoadingPdf,
        navigateToTool,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocument = () => {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error('useDocument must be used within DocumentProvider');
  return ctx;
};

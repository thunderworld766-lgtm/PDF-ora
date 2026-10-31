import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pageRotations: Record<number, number>; // 0-based page index -> rotation in deg
  rotatePage: (pageIndex: number, degreesToAdd: number) => void;

  // Document management
  documents: DocumentItem[];
  loadPdfFromBuffer: (buffer: Uint8Array | ArrayBuffer, fileName: string) => Promise<boolean>;
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
  const undoStack = useRef<{ annotations: Annotation[]; rotations: Record<number, number> }[]>([]);
  const redoStack = useRef<{ annotations: Annotation[]; rotations: Record<number, number> }[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const pushHistory = useCallback(() => {
    undoStack.current = [...undoStack.current.slice(-49), { annotations, rotations: pageRotations }];
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [annotations, pageRotations]);

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
      const uint8 = buffer instanceof Uint8Array ? buffer.slice() : new Uint8Array(buffer.slice(0));
      const metadata = await getPdfMetadata(uint8);
      if (!metadata.pageCount) throw new Error('The PDF has no readable pages.');

      setPdfBytes(uint8);
      setPdfFileName(fileName);
      setPageCount(metadata.pageCount);
      setPagesInfo(metadata.pages);
      setCurrentPage(1);
      setAnnotations([]);
      setPageRotations({});
      undoStack.current = [];
      redoStack.current = [];
      setCanUndo(false);
      setCanRedo(false);
      setZoomLevel(1.0);

      addToast('success', 'PDF Loaded Successfully', `${fileName} (${metadata.pageCount} pages) ready for editing.`);
      return true;
    } catch (err: any) {
      console.error('Failed to load PDF buffer:', err);
      addToast('error', 'Error loading PDF', err.message || 'Please check if the file is a valid PDF');
      return false;
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
    pushHistory();
    const newAnn: Annotation = {
      ...ann,
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setAnnotations(prev => [...prev, newAnn]);
    addToast('info', 'Annotation Added', `Added ${ann.type} to page ${ann.pageNumber}`);
  };

  const removeAnnotation = (id: string) => {
    if (!window.confirm('Remove this annotation?')) return;
    pushHistory();
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const clearAnnotations = () => {
    if (!annotations.length) return;
    if (!window.confirm('Remove all annotations from this document?')) return;
    pushHistory();
    setAnnotations([]);
  };

  const undo = () => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push({ annotations, rotations: pageRotations });
    setAnnotations(previous.annotations);
    setPageRotations(previous.rotations);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
  };

  const redo = () => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push({ annotations, rotations: pageRotations });
    setAnnotations(next.annotations);
    setPageRotations(next.rotations);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
  };

  const rotatePage = (pageIndex: number, degreesToAdd: number) => {
    pushHistory();
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
      await storageService.saveDocumentBytes(newDoc.id, pdfBytes.slice());
      setDocuments(storageService.getDocuments());
      addToast('success', 'Saved to My Documents', `${pdfFileName} is secured in your local vault.`);
      return newDoc;
    } catch (err: any) {
      addToast('error', 'Failed to save document', err.message);
      return null;
    }
  };

  const deleteDocument = (id: string) => {
    if (!window.confirm('Remove this document from the local vault?')) return;
    storageService.deleteDocument(id);
    void storageService.deleteDocumentBytes(id);
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

  useEffect(() => {
    void storageService.getSession().then((session) => {
      if (!session || pdfBytes) return;
      void loadPdfFromBuffer(session.bytes, session.fileName).then((loaded) => {
        if (loaded) {
          setCurrentPage(Math.max(session.currentPage || 1, 1));
          setZoomLevel(session.zoomLevel || 1);
          setAnnotations(Array.isArray(session.annotations) ? session.annotations as Annotation[] : []);
          setPageRotations(session.pageRotations || {});
        }
      });
    });
    // Recover once when the provider mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pdfBytes) return;
    const timeout = window.setTimeout(() => {
      void storageService.saveSession({
        fileName: pdfFileName,
        bytes: pdfBytes.slice(),
        currentPage,
        zoomLevel,
        annotations,
        pageRotations,
      });
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [pdfBytes, pdfFileName, currentPage, zoomLevel, annotations, pageRotations]);

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
        undo,
        redo,
        canUndo,
        canRedo,
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

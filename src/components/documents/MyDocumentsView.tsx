import React, { useState, useRef } from 'react';
import { 
  FolderArchive, 
  Search, 
  Filter, 
  Grid, 
  List as ListIcon, 
  Star, 
  FileText, 
  Download, 
  Trash2, 
  UploadCloud, 
  Sparkles, 
  Tag, 
  Clock, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { useDocument } from '../../context/DocumentContext';
import { formatBytes, formatDate } from '../../utils/cn';
import { createSamplePDF } from '../../services/samplePdfs';

export const MyDocumentsView: React.FC = () => {
  const { 
    documents, 
    deleteDocument, 
    toggleStar, 
    loadPdfFromBuffer, 
    setCurrentView, 
    loadSampleDocument,
    addToast 
  } = useDocument();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'starred'>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterMode === 'all' || (filterMode === 'starred' && doc.isStarred);
    return matchesSearch && matchesFilter;
  });

  const handleOpenDoc = async (doc: any) => {
    try {
      if (doc.fileData) {
        await loadPdfFromBuffer(doc.fileData, doc.name);
      } else {
        const sample = await createSamplePDF(doc.name.replace('.pdf', ''));
        await loadPdfFromBuffer(sample, doc.name);
      }
      setCurrentView('editor');
    } catch (err: any) {
      addToast('error', 'Could not open document', err.message);
    }
  };

  const handleUploadNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const buf = await file.arrayBuffer();
      await loadPdfFromBuffer(buf, file.name);
      setCurrentView('editor');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 p-6 lg:p-10 bg-grid-pattern">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Document Vault
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/25 font-bold">
                {documents.length} Files
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Your secured documents with local client persistence and future Cloudflare R2 backup.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs text-white font-semibold shadow-lg shadow-brand-600/30 flex items-center gap-1.5 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import PDF File</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleUploadNew}
            />
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or tags..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterMode === 'all' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Documents
              </button>
              <button
                onClick={() => setFilterMode('starred')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  filterMode === 'starred' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Star className="w-3 h-3 fill-current text-amber-400" />
                <span>Starred</span>
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewLayout === 'grid' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewLayout === 'list' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Empty state */}
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
            <FolderArchive className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No documents found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Try adjusting your search filter or generate a sample document.
            </p>
            <button
              onClick={loadSampleDocument}
              className="px-4 py-2 rounded-xl bg-brand-600 text-xs font-semibold text-white"
            >
              Load Sample Document
            </button>
          </div>
        ) : viewLayout === 'grid' ? (
          /* Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleOpenDoc(doc)}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-brand-500/50 cursor-pointer transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(doc.id);
                      }}
                      className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                        doc.isStarred ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <h3 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors truncate mb-1">
                    {doc.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 mb-3">
                    {doc.pageCount} pages • {formatBytes(doc.sizeBytes)}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {doc.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{formatDate(doc.updatedAt)}</span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenDoc(doc)}
                      className="px-2.5 py-1 rounded bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white font-medium text-xs transition-colors"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List Layout */
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 divide-y divide-slate-800/60 overflow-hidden">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleOpenDoc(doc)}
                className="p-4 flex items-center justify-between hover:bg-slate-900/80 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-brand-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-brand-300 truncate">
                      {doc.name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{doc.pageCount} pages</span>
                      <span>•</span>
                      <span>{formatBytes(doc.sizeBytes)}</span>
                      <span>•</span>
                      <span>Updated {formatDate(doc.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleStar(doc.id)}
                    className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                      doc.isStarred ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                  <button
                    onClick={() => handleOpenDoc(doc)}
                    className="px-3 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    Open in Editor
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

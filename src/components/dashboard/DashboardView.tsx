import React from 'react';
import { 
  FileText, 
  Layers, 
  Scissors, 
  PenTool, 
  Clock, 
  HardDrive, 
  Star, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Plus, 
  Download, 
  Trash2, 
  ExternalLink,
  CloudLightning
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDocument } from '../../context/DocumentContext';
import { formatBytes, formatDate } from '../../utils/cn';
import { createSamplePDF } from '../../services/samplePdfs';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const { 
    documents, 
    setCurrentView, 
    navigateToTool, 
    loadPdfFromBuffer, 
    loadSampleDocument, 
    deleteDocument, 
    toggleStar,
    addToast 
  } = useDocument();

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

  const totalPages = documents.reduce((sum, d) => sum + (d.pageCount || 1), 0);
  const totalBytes = documents.reduce((sum, d) => sum + (d.sizeBytes || 0), 0);
  const storageLimit = user?.storageLimitBytes || 10 * 1024 * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((totalBytes / storageLimit) * 100));

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 p-6 lg:p-10 bg-grid-pattern">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.name.split(' ')[0] || 'Creator'} 👋
              </h1>
              <span className="text-xs px-2 py-0.5 font-bold bg-brand-500/10 text-brand-400 border border-brand-500/25 rounded-full">
                {user?.tier || 'Pro'} Workspace
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Your client-side document workstation is running with zero data leakage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadSampleDocument}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Interactive Demo</span>
            </button>
            <button
              onClick={() => setCurrentView('editor')}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs text-white font-semibold shadow-lg shadow-brand-600/30 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New PDF Project</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold">Active Documents</span>
              <FileText className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl font-black text-white">{documents.length}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span>● Local client vault synced</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold">Processed Pages</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalPages}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Sub-second vector parsing
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold">Storage Utilized</span>
              <HardDrive className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">{formatBytes(totalBytes)}</div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                style={{ width: `${Math.max(4, storagePercent)}%` }}
                className="bg-brand-500 h-full rounded-full"
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold">Security Architecture</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400">Air-Gapped Private</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Zero outbound data transmission
            </div>
          </div>

        </div>

        {/* Quick Tools Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Quick PDF Actions
            </h2>
            <button
              onClick={() => setCurrentView('tools')}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
            >
              <span>Explore all tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: 'merge', title: 'Merge PDFs', desc: 'Combine documents', icon: <Layers className="w-5 h-5 text-indigo-400" /> },
              { id: 'split', title: 'Split PDF', desc: 'Extract pages', icon: <Scissors className="w-5 h-5 text-sky-400" /> },
              { id: 'sign', title: 'Sign Document', desc: 'Add signature', icon: <PenTool className="w-5 h-5 text-emerald-400" /> },
              { id: 'compress', title: 'Compress File', desc: 'Reduce file size', icon: <Sparkles className="w-5 h-5 text-violet-400" /> },
            ].map((tool) => (
              <div
                key={tool.id}
                onClick={() => navigateToTool(tool.id as any)}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-brand-500/50 cursor-pointer transition-all group"
              >
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 inline-block mb-3 group-hover:scale-110 transition-transform">
                  {tool.icon}
                </div>
                <div className="text-xs font-bold text-white mb-0.5">{tool.title}</div>
                <div className="text-[11px] text-slate-400">{tool.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Documents Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Recent Documents</h2>
              <p className="text-xs text-slate-400">Click any document to inspect or edit in workspace</p>
            </div>
            <button
              onClick={() => setCurrentView('documents')}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              View Document Vault →
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden divide-y divide-slate-800/60">
            {documents.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                className="p-4 flex items-center justify-between hover:bg-slate-900/80 transition-colors cursor-pointer group"
                onClick={() => handleOpenDoc(doc)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors truncate">
                      {doc.name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{doc.pageCount} pages</span>
                      <span>•</span>
                      <span>{formatBytes(doc.sizeBytes)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleStar(doc.id)}
                    className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                      doc.isStarred ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={() => handleOpenDoc(doc)}
                    className="px-3 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    Open
                  </button>

                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Layers, 
  Scissors, 
  Minimize2, 
  RotateCw, 
  PenTool, 
  Image as ImageIcon, 
  ArrowRight, 
  UploadCloud, 
  CheckCircle2, 
  CloudLightning, 
  Globe2,
  FileCheck,
  ChevronRight,
  Star
} from 'lucide-react';
import { useDocument } from '../../context/DocumentContext';
import { ToolType } from '../../types';

export const LandingPage: React.FC = () => {
  const { loadSampleDocument, loadPdfFromBuffer, setCurrentView, navigateToTool, addToast } = useDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openPdfFile = async (file?: File) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      addToast('error', 'Invalid file type', 'Please select a valid PDF file.');
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const loaded = await loadPdfFromBuffer(buffer, file.name);
      if (loaded) setCurrentView('editor');
    } catch (error: any) {
      addToast('error', 'Could not open PDF', error?.message || 'Please choose a valid PDF file.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    void openPdfFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void openPdfFile(e.dataTransfer.files?.[0]);
  };

  const toolsList: { id: ToolType; title: string; desc: string; icon: React.ReactNode; color: string; badge?: string }[] = [
    {
      id: 'merge',
      title: 'Merge PDF',
      desc: 'Combine multiple PDF files into a single structured document in any page order.',
      icon: <Layers className="w-5 h-5 text-indigo-400" />,
      color: 'from-indigo-500/20 to-brand-500/10 border-indigo-500/30',
      badge: 'Most Popular'
    },
    {
      id: 'split',
      title: 'Split & Extract',
      desc: 'Separate pages or extract specific chapters into independent lightweight files.',
      icon: <Scissors className="w-5 h-5 text-sky-400" />,
      color: 'from-sky-500/20 to-blue-500/10 border-sky-500/30',
    },
    {
      id: 'sign',
      title: 'Sign & Stamp',
      desc: 'Draw or type smooth vector signatures, company stamps, and approval seals.',
      icon: <PenTool className="w-5 h-5 text-emerald-400" />,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
      badge: 'Secure'
    },
    {
      id: 'compress',
      title: 'Compress PDF',
      desc: 'Optimize embedded images and stream tables to shrink file size while preserving readability.',
      icon: <Minimize2 className="w-5 h-5 text-violet-400" />,
      color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
    },
    {
      id: 'rotate',
      title: 'Rotate Pages',
      desc: 'Correct sideways scans or invert specific landscape/portrait orientations in batch.',
      icon: <RotateCw className="w-5 h-5 text-amber-400" />,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
    },
    {
      id: 'watermark',
      title: 'Watermark & Brand',
      desc: 'Stamp confidential badges, company watermarks, or draft banners across your pages.',
      icon: <ShieldCheck className="w-5 h-5 text-rose-400" />,
      color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30',
    },
    {
      id: 'pdf-to-img',
      title: 'PDF to High-Res Image',
      desc: 'Convert PDF pages into crystal-clear PNG or JPG raster images for presentations.',
      icon: <ImageIcon className="w-5 h-5 text-cyan-400" />,
      color: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30',
    },
    {
      id: 'img-to-pdf',
      title: 'Images to PDF',
      desc: 'Compile photo receipts, blueprints, or documents into a clean cohesive PDF book.',
      icon: <FileCheck className="w-5 h-5 text-fuchsia-400" />,
      color: 'from-fuchsia-500/20 to-indigo-500/10 border-fuchsia-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 bg-grid-pattern relative">
      
      {/* Top glowing ambient gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-brand-600/15 blur-[140px] pointer-events-none rounded-full" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Release Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-6 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>PDFora 2026 Release — Everything Your PDF Needs</span>
          <ChevronRight className="w-3.5 h-3.5 text-brand-400" />
        </motion.div>

        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]"
        >
          Everything Your PDF Needs.{' '}
          <span className="block mt-2 brand-gradient-text">
            Sleek, Powerful, In-Browser.
          </span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Edit, annotate, merge, split, sign, rotate, and secure PDF files without exposing sensitive data to cloud servers. Built with modern WebAssembly, React & PDF-Lib.
        </motion.p>

        {/* Interactive Drop Zone & CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10 max-w-2xl mx-auto"
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={handleDrop}
            className="p-8 sm:p-10 rounded-3xl border-2 border-dashed border-brand-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl shadow-glow hover:border-brand-400 transition-all duration-300 group"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 group-hover:scale-110 group-hover:bg-brand-500/20 transition-all duration-300 mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Drop your PDF file here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-brand-400 hover:text-brand-300 underline underline-offset-4 font-semibold"
                >
                  browse computer
                </button>
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-6">
                Fast client-side vector engine. No uploads required for total data security.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />

              <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-600/30 flex items-center gap-2 group/btn"
                >
                  <FileText className="w-4 h-4" />
                  <span>Choose PDF File</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={loadSampleDocument}
                  className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Load Interactive Sample PDF</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Value Prop Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% In-Browser Privacy</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Sub-second Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <CloudLightning className="w-4 h-4 text-brand-400" />
            <span>Cloudflare R2 & Supabase Ready</span>
          </div>
        </div>

      </section>

      {/* Feature Tools Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-2">
              Comprehensive Suite
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Every PDF Tool In One Minimal Interface
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md mt-4 md:mt-0">
            Browser-based tools for document editing, conversion, and page management.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {toolsList.map((tool) => (
            <motion.div
              key={tool.id}
              whileHover={{ y: -4 }}
              onClick={() => navigateToTool(tool.id)}
              className={`p-6 rounded-2xl border bg-gradient-to-b ${tool.color} backdrop-blur-md cursor-pointer transition-all group relative overflow-hidden`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 group-hover:scale-110 transition-transform">
                  {tool.icon}
                </div>
                {tool.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                    {tool.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
                <span>{tool.title}</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {tool.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive Editor Workspace Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            
            <div className="space-y-6">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Client-Side Vector Engine
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Inspect, Rearrange, and Sign Right in the Canvas.
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                PDFora provides a Figma-grade document canvas. Add text boxes, custom date stamps, high-resolution vector signatures, watermarks, or rotate pages in real-time.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-brand-400" />
                  <span>Interactive thumbnail sidebar with drag reorder</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-brand-400" />
                  <span>Freehand vector signature pad with smooth curves</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-brand-400" />
                  <span>High-DPI canvas rasterization powered by PDF.js</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={loadSampleDocument}
                  className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-600/30 flex items-center gap-2"
                >
                  <span>Launch Editor Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mock Editor Canvas UI Showcase */}
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  <span className="font-mono text-[11px] text-slate-300 ml-2">Executive_Brief_v2.pdf</span>
                </div>
                <span className="text-[10px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded border border-brand-500/20">
                  Page 1 of 4 • 100%
                </span>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 min-h-[260px] flex items-center justify-center relative overflow-hidden">
                <div className="w-48 h-64 bg-white text-slate-900 rounded shadow-lg p-3 text-[8px] flex flex-col justify-between select-none">
                  <div>
                    <div className="h-4 bg-brand-700 rounded mb-2 w-3/4" />
                    <div className="space-y-1">
                      <div className="h-1.5 bg-slate-200 rounded w-full" />
                      <div className="h-1.5 bg-slate-200 rounded w-5/6" />
                      <div className="h-1.5 bg-slate-200 rounded w-4/6" />
                    </div>
                  </div>

                  <div className="border border-dashed border-brand-400 rounded p-1 bg-brand-50/50">
                    <span className="text-[6px] text-brand-600 font-bold block mb-1">Signed via PDFora</span>
                    <div className="text-[9px] font-serif italic text-brand-900">Your Signature</div>
                  </div>
                </div>

                <div className="absolute top-4 right-4 bg-slate-950/90 border border-slate-700 px-3 py-1.5 rounded-lg text-[10px] text-emerald-400 flex items-center gap-1.5 shadow-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Real-time vector preview</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Why Professionals Prefer PDFora
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Compare PDFora against traditional web PDF utilities.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-4 px-4 font-semibold">Capabilities</th>
                <th className="py-4 px-4 font-bold text-brand-400 bg-brand-500/10 rounded-t-xl">PDFora Platform</th>
                <th className="py-4 px-4 font-semibold">Legacy Online Converters</th>
                <th className="py-4 px-4 font-semibold">Desktop Adobe Acrobat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3 px-4 font-medium text-white">Data Privacy & Processing</td>
                <td className="py-3 px-4 font-bold text-emerald-400 bg-brand-500/5">100% In-Browser (No Leaks)</td>
                <td className="py-3 px-4 text-rose-400">Uploads to random servers</td>
                <td className="py-3 px-4 text-slate-300">Local desktop application</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Speed & Latency</td>
                <td className="py-3 px-4 font-bold text-emerald-400 bg-brand-500/5">Sub-second WebAssembly</td>
                <td className="py-3 px-4 text-amber-400">High upload/download queue</td>
                <td className="py-3 px-4 text-slate-300">Fast but bulky installer</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Interactive Visual Editor</td>
                <td className="py-3 px-4 font-bold text-emerald-400 bg-brand-500/5">Built-in with Annotations</td>
                <td className="py-3 px-4 text-rose-400">Basic conversion only</td>
                <td className="py-3 px-4 text-slate-300">Comprehensive</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Subscription & Limits</td>
                <td className="py-3 px-4 font-bold text-emerald-400 bg-brand-500/5">Generous & Open Client</td>
                <td className="py-3 px-4 text-rose-400">2 files / day paywall</td>
                <td className="py-3 px-4 text-rose-400">\$240+ / year expensive</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-glow-lg relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to experience the future of PDF editing?
          </h2>
          <p className="text-sm text-indigo-100 max-w-xl mx-auto mb-8">
            Try the browser tools immediately, or sign in with Google to access your dashboard and saved documents.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={loadSampleDocument}
              className="px-6 py-3 rounded-xl bg-white text-brand-700 hover:bg-slate-100 font-bold text-xs shadow-xl active:scale-95 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-brand-600" />
  <span>Open Sample Document</span>
            </button>
            <button
              onClick={() => setCurrentView('tools')}
              className="px-6 py-3 rounded-xl bg-brand-800/80 hover:bg-brand-900 border border-white/20 text-white font-semibold text-xs active:scale-95 transition-all"
            >
              Browse All 12 PDF Tools
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

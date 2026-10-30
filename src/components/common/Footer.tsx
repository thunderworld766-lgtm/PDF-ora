import React from 'react';
import { FileText, Shield, Zap, Sparkles, Heart, Github, Twitter, Linkedin, ExternalLink } from 'lucide-react';
import { useDocument } from '../../context/DocumentContext';

export const Footer: React.FC = () => {
  const { setCurrentView, navigateToTool } = useDocument();

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                PDF<span className="text-brand-400">ora</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              PDFora — Everything Your PDF Needs. The ultra-modern, privacy-first PDF operating platform. Edit, annotate, merge, convert, sign, and safeguard your documents entirely client-side with future cloud sync.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-emerald-400">
                <Shield className="w-3.5 h-3.5" /> 100% Client-Side Private
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-brand-300">
                <Zap className="w-3.5 h-3.5" /> Zero Lag WebAssembly
              </span>
            </div>
          </div>

          {/* Quick Tools */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Popular Tools</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigateToTool('merge')} className="hover:text-brand-400 transition-colors">
                  Merge Multiple PDFs
                </button>
              </li>
              <li>
                <button onClick={() => navigateToTool('split')} className="hover:text-brand-400 transition-colors">
                  Split & Extract Pages
                </button>
              </li>
              <li>
                <button onClick={() => navigateToTool('sign')} className="hover:text-brand-400 transition-colors">
                  Sign & Digital Stamp
                </button>
              </li>
              <li>
                <button onClick={() => navigateToTool('compress')} className="hover:text-brand-400 transition-colors">
                  Compress PDF Size
                </button>
              </li>
              <li>
                <button onClick={() => navigateToTool('watermark')} className="hover:text-brand-400 transition-colors">
                  Watermark & Brand
                </button>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Workspace</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setCurrentView('editor')} className="hover:text-brand-400 transition-colors">
                  Interactive Editor Canvas
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('dashboard')} className="hover:text-brand-400 transition-colors">
                  Productivity Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('documents')} className="hover:text-brand-400 transition-colors">
                  Document Vault
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('settings')} className="hover:text-brand-400 transition-colors">
                  Cloudflare R2 & Supabase Setup
                </button>
              </li>
            </ul>
          </div>

          {/* Architecture & Tech Stack */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Tech Stack</h4>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">React 18</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">TypeScript</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">Tailwind CSS</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">PDF.js</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">pdf-lib</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">Framer Motion</span>
              <span className="px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-[10px] text-brand-300">Supabase Ready</span>
              <span className="px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-[10px] text-brand-300">Cloudflare R2</span>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} PDFora. All rights reserved. Built for high-performance browser-native document intelligence.
          </p>
          <div className="flex items-center gap-4 text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Security Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

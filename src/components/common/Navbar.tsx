import React from 'react';
import { 
  FileText, 
  Layers, 
  Sparkles, 
  FolderArchive, 
  Settings as SettingsIcon, 
  LayoutDashboard, 
  User, 
  Sun, 
  Moon, 
  LogOut, 
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDocument } from '../../context/DocumentContext';
import { useTheme } from '../../context/ThemeContext';
import { AppView } from '../../types';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, setShowAuthModal, setAuthModalMode } = useAuth();
  const { currentView, setCurrentView, loadSampleDocument, pdfBytes } = useDocument();
  const { theme, toggleTheme } = useTheme();

  const navLinks: { id: AppView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'landing', label: 'Home', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'tools', label: 'PDF Tools', icon: <Layers className="w-4 h-4" />, badge: '12+' },
    { id: 'editor', label: 'Workspace Editor', icon: <FileText className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'documents', label: 'My Vault', icon: <FolderArchive className="w-4 h-4" /> },
  ];
  const visibleNavLinks = isAuthenticated
    ? navLinks
    : navLinks.filter((link) => link.id === 'landing' || link.id === 'tools' || link.id === 'editor');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <div 
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 p-0.5 shadow-glow group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-400 group-hover:text-brand-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-brand-300 transition-colors">
                PDF<span className="text-brand-400">ora</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/30 rounded-full tracking-wider uppercase">
PDF Tools
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block tracking-wide">
              Everything Your PDF Needs
            </p>
          </div>
        </div>

        {/* Center Navigation Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800/80">
          {visibleNavLinks.map((link) => {
            const isActive = currentView === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  if (link.id === 'editor' && !pdfBytes) {
                    loadSampleDocument();
                  } else {
                    setCurrentView(link.id);
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 relative ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
                {link.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-brand-500/20 text-brand-300'
                  }`}>
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Icons & Auth Profile */}
        <div className="flex items-center gap-3">
          
          {/* Quick Sample / Launch Editor CTA */}
          <button
            onClick={() => {
              if (!pdfBytes) {
                loadSampleDocument();
              } else {
                setCurrentView('editor');
              }
            }}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg shadow-brand-600/20 active:scale-95 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>{pdfBytes ? 'Return to Editor' : 'Try Sample PDF'}</span>
          </button>

          {/* Settings Shortcut */}
          <button
            onClick={() => setCurrentView('settings')}
            title="Platform Settings & Cloud Integration"
            className={`p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border transition-colors ${
              currentView === 'settings' ? 'border-brand-500 text-brand-400 bg-slate-900' : 'border-transparent'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User profile dropdown or Login CTA */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div 
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full ring-2 ring-brand-500/50 object-cover group-hover:ring-brand-400 transition-all"
                />
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1">
                    {user.name.split(' ')[0]}
                    <span className="text-[10px] text-brand-400 bg-brand-500/10 px-1 rounded border border-brand-500/20">
                      Account
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {user.email.substring(0, 15)}...
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setShowAuthModal(true);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthModalMode('signup');
                  setShowAuthModal(true);
                }}
                className="px-3.5 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-all"
              >
                Get Started
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950/90 py-2 px-3">
        {visibleNavLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => {
              if (link.id === 'editor' && !pdfBytes) {
                loadSampleDocument();
              } else {
                setCurrentView(link.id);
              }
            }}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-2 rounded-lg ${
              currentView === link.id ? 'text-brand-400 font-semibold' : 'text-slate-400'
            }`}
          >
            {link.icon}
            <span>{link.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};

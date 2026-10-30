import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDocument } from '../../context/DocumentContext';
import { Modal } from '../common/Modal';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, authModalMode, setAuthModalMode, login, signup, continueAsGuest } = useAuth();
  const { addToast } = useDocument();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authModalMode === 'login') {
        await login(email, password);
        addToast('success', 'Welcome Back!', `Signed in as ${email || 'Alex Morgan'}`);
      } else if (authModalMode === 'signup') {
        await signup(name, email, password);
        addToast('success', 'Account Created!', `Welcome to PDFora Pro, ${name || 'Creator'}`);
      } else {
        addToast('info', 'Password Reset Email Sent', `Check inbox for ${email} with instructions.`);
        setAuthModalMode('login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    addToast('info', 'Guest Session Started', 'Exploring PDFora with local client storage.');
  };

  return (
    <Modal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      title={
        authModalMode === 'login'
          ? 'Sign in to PDFora'
          : authModalMode === 'signup'
          ? 'Create your PDFora account'
          : 'Reset your password'
      }
      subtitle={
        authModalMode === 'login'
          ? 'Access your cloud workspace, recent PDF vaults, and integrations'
          : authModalMode === 'signup'
          ? 'Join high-performance teams managing PDFs with zero data leakage'
          : 'Enter your email to receive a recovery link'
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        
        {/* Social Fast Connect */}
        {authModalMode !== 'forgot' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                login('alex.google@pdfora.io', 'google');
                addToast('success', 'Google Auth Connected');
              }}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => {
                login('alex.github@pdfora.io', 'github');
                addToast('success', 'GitHub Auth Connected');
              }}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>
        )}

        {authModalMode !== 'forgot' && (
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-widest font-mono">
              or continue with email
            </span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalMode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
          </div>

          {authModalMode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Password</label>
                {authModalMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setAuthModalMode('forgot')}
                    className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            <span>
              {authModalMode === 'login'
                ? 'Sign In to Workspace'
                : authModalMode === 'signup'
                ? 'Create Pro Account'
                : 'Send Reset Link'}
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Guest Mode & Switch View */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2 text-center">
          <button
            type="button"
            onClick={handleGuest}
            className="text-xs text-slate-400 hover:text-brand-300 font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Continue as Guest (No Login Required)</span>
          </button>

          <div className="text-xs text-slate-400">
            {authModalMode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  onClick={() => setAuthModalMode('signup')}
                  className="text-brand-400 font-semibold hover:underline"
                >
                  Sign up free
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => setAuthModalMode('login')}
                  className="text-brand-400 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>

      </div>
    </Modal>
  );
};

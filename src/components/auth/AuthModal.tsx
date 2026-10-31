import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDocument } from '../../context/DocumentContext';
import { Modal } from '../common/Modal';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, loginWithGoogle } = useAuth();
  const { addToast } = useDocument();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      addToast('success', 'Signed in successfully', 'Welcome to PDFora');
    } catch (error: any) {
      if (error?.code === 'auth/unauthorized-domain') {
        addToast(
          'error',
          'Google sign-in blocked',
          `Add "${window.location.hostname}" in Firebase Console → Authentication → Settings → Authorized domains.`
        );
      } else {
        addToast('error', 'Google sign-in failed', error?.message || 'Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      title="Sign in to PDFora"
      subtitle="Continue securely with your Google account"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-all disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
          </svg>
          <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
          <span>PDF processing remains in your browser. Sign-in is used only for your account.</span>
        </div>
      </div>
    </Modal>
  );
};

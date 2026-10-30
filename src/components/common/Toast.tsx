import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useDocument } from '../../context/DocumentContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useDocument();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
            info: <Info className="w-5 h-5 text-brand-400 shrink-0" />,
          };

          const borderColors = {
            success: 'border-emerald-500/30 bg-slate-900/90 shadow-emerald-500/10',
            error: 'border-rose-500/30 bg-slate-900/90 shadow-rose-500/10',
            warning: 'border-amber-500/30 bg-slate-900/90 shadow-amber-500/10',
            info: 'border-brand-500/30 bg-slate-900/90 shadow-brand-500/10',
          };

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-xl shadow-xl flex items-start gap-3 ${borderColors[toast.type]}`}
            >
              {icons[toast.type]}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white tracking-wide">
                  {toast.title}
                </div>
                {toast.message && (
                  <div className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                    {toast.message}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

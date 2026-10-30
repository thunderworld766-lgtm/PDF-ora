import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ShieldAlert, Check } from 'lucide-react';
import { applyWatermark } from '../../services/pdfService';
import { useDocument } from '../../context/DocumentContext';

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WatermarkModal: React.FC<WatermarkModalProps> = ({ isOpen, onClose }) => {
  const { pdfBytes, loadPdfFromBuffer, pdfFileName, addToast } = useDocument();

  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.2);
  const [fontSize, setFontSize] = useState(50);
  const [angle, setAngle] = useState(45);
  const [isProcessing, setIsProcessing] = useState(false);

  const presets = ['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'OFFICIAL COPY', 'APPROVED'];

  const handleApply = async () => {
    if (!pdfBytes) return;
    try {
      setIsProcessing(true);
      const updatedBytes = await applyWatermark(pdfBytes, text, {
        fontSize,
        opacity,
        angle,
      });

      await loadPdfFromBuffer(updatedBytes, pdfFileName.replace('.pdf', '_watermarked.pdf'));
      addToast('success', 'Watermark Applied', `Watermark "${text}" stamped across all pages.`);
      onClose();
    } catch (err: any) {
      addToast('error', 'Failed to apply watermark', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Document Watermark"
      subtitle="Embed vector watermark stamps across all pages with custom angle and opacity"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Presets */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Preset Stamps</label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setText(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  text === p
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Custom text */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Watermark Text</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min="0.05"
              max="0.8"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full accent-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Font Size: {fontSize}pt
            </label>
            <input
              type="range"
              min="24"
              max="80"
              step="2"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="w-full accent-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Angle: {angle}°
            </label>
            <input
              type="range"
              min="0"
              max="90"
              step="15"
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value, 10))}
              className="w-full accent-brand-500"
            />
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-950 relative overflow-hidden flex items-center justify-center min-h-[100px] select-none">
          <div className="text-slate-600 text-xs text-center space-y-1">
            <p>Page 1 Content Simulation</p>
            <p className="text-[10px]">Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none font-black tracking-widest text-slate-200"
            style={{
              opacity,
              fontSize: `${Math.min(fontSize, 36)}px`,
              transform: `rotate(${angle}deg)`,
            }}
          >
            {text}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing || !text.trim()}
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/30 flex items-center gap-1.5 disabled:opacity-50 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>{isProcessing ? 'Watermarking...' : 'Stamp All Pages'}</span>
          </button>
        </div>

      </div>
    </Modal>
  );
};

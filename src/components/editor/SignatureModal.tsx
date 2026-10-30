import React, { useRef, useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Eraser, Check, Type, PenLine } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('Alex Morgan');
  const [inkColor, setInkColor] = useState('#1e293b'); // dark navy slate

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen, activeTab, inkColor]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirm = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      onSaveSignature(dataUrl);
    } else {
      // Generate signature image from text font
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = 'italic 48px "Brush Script MT", "Caveat", "Dancing Script", cursive';
        ctx.fillStyle = inkColor;
        ctx.fillText(typedName, 30, 90);
        const dataUrl = canvas.toDataURL('image/png');
        onSaveSignature(dataUrl);
      }
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Digital Signature"
      subtitle="Draw your signature or choose a stylized script font to stamp onto the document"
      maxWidth="md"
    >
      <div className="space-y-4">
        
        {/* Mode Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'draw'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <PenLine className="w-4 h-4" />
            <span>Draw with Mouse / Stylus</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('type')}
            className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'type'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Type Script Name</span>
          </button>
        </div>

        {/* Color picker */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>Ink Color:</span>
          <div className="flex items-center gap-2">
            {[
              { label: 'Navy', hex: '#1e293b' },
              { label: 'Deep Blue', hex: '#1d4ed8' },
              { label: 'Black', hex: '#020617' },
              { label: 'Emerald', hex: '#047857' },
            ].map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setInkColor(c.hex)}
                style={{ backgroundColor: c.hex }}
                className={`w-5 h-5 rounded-full border transition-all ${
                  inkColor === c.hex ? 'ring-2 ring-brand-400 scale-110' : 'border-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Drawing Canvas or Typed Input */}
        {activeTab === 'draw' ? (
          <div className="relative border border-slate-700 bg-white rounded-xl overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={450}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-44 cursor-crosshair touch-none"
            />
            <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 pointer-events-none select-none">
              Sign above this guideline
            </div>
            <div className="absolute bottom-5 left-3 right-3 border-b border-dashed border-slate-300 pointer-events-none" />
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />

            <div className="p-6 rounded-xl border border-slate-700 bg-white flex items-center justify-center min-h-[120px]">
              <span
                style={{
                  fontFamily: 'cursive, "Brush Script MT", "Dancing Script"',
                  fontSize: '36px',
                  color: inkColor,
                }}
              >
                {typedName || 'Your Signature'}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {activeTab === 'draw' && (
            <button
              type="button"
              onClick={clearCanvas}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1.5 transition-colors"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/30 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Apply Signature</span>
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};

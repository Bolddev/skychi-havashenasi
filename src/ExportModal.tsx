import { useState } from 'react';
import { useStore } from './store';
import { exportLevels, generateExportText, copyToClipboard } from './export';
import { X, Copy, Check, FileText } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: Props) {
  const { decision, getActiveProfile } = useStore();
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | null>(null);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState('');

  if (!isOpen || !decision) return null;

  const profile = getActiveProfile();

  const handleSelectLevel = (level: 1 | 2 | 3) => {
    setSelectedLevel(level);
    const text = generateExportText(level, profile, decision);
    setPreview(text);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!selectedLevel) return;
    const text = generateExportText(selectedLevel, profile, decision);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleClose = () => {
    setSelectedLevel(null);
    setPreview('');
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 glass-strong rounded-2xl overflow-hidden animate-fade-in max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/30">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-accent" />
            <h2 className="text-lg font-semibold">خروجی اطلاعات</h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!selectedLevel ? (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary mb-4">سطح خروجی را انتخاب کنید:</p>
              {exportLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleSelectLevel(level.id)}
                  className="w-full glass-card p-4 text-right hover:bg-white/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{level.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{level.title}</div>
                      <div className="text-xs text-text-secondary mt-0.5">{level.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                {exportLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => handleSelectLevel(level.id)}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                      selectedLevel === level.id ? 'bg-accent text-white' : 'glass-card hover:bg-white/80'
                    }`}
                  >
                    {level.icon} سطح {level.id}
                  </button>
                ))}
              </div>

              <div className="glass-card p-3 max-h-64 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-sans leading-6 text-text-primary" dir="rtl">
                  {preview}
                </pre>
              </div>

              <button
                onClick={handleCopy}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  copied ? 'bg-success text-white' : 'btn-primary'
                }`}
              >
                {copied ? (<><Check size={18} />کپی شد!</>) : (<><Copy size={18} />کپی در کلیپ‌بورد</>)}
              </button>

              <button
                onClick={() => { setSelectedLevel(null); setPreview(''); }}
                className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                ← تغییر سطح
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

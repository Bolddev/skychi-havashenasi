import { GlassCard, Button } from '../ui';
import { useOnlineStatus } from '../../hooks';
import { useStore } from '../../store';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

// ============================================================
// ۱۰.۱ بنر آفلاین
// ============================================================
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { lastFetch, fetchAndEvaluate } = useStore();

  if (isOnline) return null;

  const minutesAgo = lastFetch ? Math.round((Date.now() - lastFetch) / (60 * 1000)) : null;

  return (
    <div className="glass-2 border-2 border-warning/30 bg-warning/10 rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-3">
        <WifiOff size={24} className="text-warning flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-warning-text">آفلاین</p>
          <p className="text-xs text-text-secondary">
            {minutesAgo !== null
              ? `داده ${minutesAgo} دقیقه پیش — برای به‌روزرسانی باید آنلاین باشید`
              : 'برای دریافت داده باید آنلاین باشید'}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchAndEvaluate()}
          disabled={!isOnline}
        >
          <RefreshCw size={14} />
          تلاش مجدد
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// ۱۰.۲ صفحه خطای شبکه
// ============================================================
export function NetworkErrorScreen() {
  const { fetchAndEvaluate } = useStore();

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <GlassCard level={2} className="max-w-md text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">خطای اتصال</h2>
        <p className="text-sm text-text-secondary mb-6">
          اتصال به اینترنت برقرار نیست. لطفاً اتصال خود را بررسی کنید و دوباره تلاش کنید.
        </p>
        <Button onClick={() => fetchAndEvaluate()} className="w-full">
          <RefreshCw size={18} />
          تلاش مجدد
        </Button>
      </GlassCard>
    </div>
  );
}

// ============================================================
// ۱۰.۳ صفحه خطای سرور
// ============================================================
export function ServerErrorScreen() {
  const { fetchAndEvaluate } = useStore();

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <GlassCard level={2} className="max-w-md text-center">
        <div className="text-6xl mb-4">🌐</div>
        <h2 className="text-xl font-bold mb-2">خطای سرور</h2>
        <p className="text-sm text-text-secondary mb-6">
          سرور هواشناسی پاسخ نداد. لطفاً چند دقیقه دیگر تلاش کنید.
        </p>
        <Button onClick={() => fetchAndEvaluate()} className="w-full">
          <RefreshCw size={18} />
          تلاش مجدد
        </Button>
      </GlassCard>
    </div>
  );
}

// ============================================================
// ۱۰.۴ نشانگر داده قدیمی
// ============================================================
export function StaleDataIndicator() {
  const { decision } = useStore();

  if (!decision?.lastUpdated.isStale) return null;

  const minutesAgo = decision.lastUpdated.minutesAgo;

  return (
    <div className="glass-2 border border-warning/30 bg-warning/5 rounded-xl p-2 mb-2">
      <div className="flex items-center gap-2 text-xs">
        <AlertTriangle size={14} className="text-warning" />
        <span className="text-warning-text">
          داده {minutesAgo} دقیقه پیش — برای به‌روزرسانی بکش
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Toast Layer
// ============================================================
export function ToastLayer() {
  const { toasts, dismissToast } = useToastLayer();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[200] max-w-lg mx-auto space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass-2 border-2 rounded-2xl p-4 flex items-center gap-3 animate-fade-in ${
            toast.type === 'success' ? 'border-success/30 bg-success/10' :
            toast.type === 'error' ? 'border-danger/30 bg-danger/10' :
            toast.type === 'warning' ? 'border-warning/30 bg-warning/10' :
            'border-info/30 bg-info/10'
          }`}
        >
          <span className="text-xl">
            {toast.type === 'success' ? '✅' :
             toast.type === 'error' ? '❌' :
             toast.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="p-1 rounded-full hover:bg-white/50"
            aria-label="بستن"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// Hook ساده برای Toast Layer
import { useState } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

function useToastLayer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, dismissToast };
}

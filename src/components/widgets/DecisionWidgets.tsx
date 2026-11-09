import { useState } from 'react';
import { useStore } from '../../store';
import { GlassCard, WeatherIcon, ProgressBar, InfoButton, Modal } from '../ui';
import { Sun, AlertTriangle } from 'lucide-react';

// ============================================================
// ۶.۲ DecisionBar
// ============================================================
export function DecisionBar() {
  const { decision } = useStore();
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  if (!decision) return null;

  const { hourlyRisk } = decision;

  const getRiskColor = (label: string) => {
    switch (label) {
      case 'safe': return 'risk-green';
      case 'caution': return 'risk-yellow';
      case 'danger': return 'risk-red';
      default: return 'bg-gray-300';
    }
  };

  const selectedRisk = selectedHour !== null ? hourlyRisk.find(h => h.hour === selectedHour) : null;

  return (
    <>
      <GlassCard level={2} className="mb-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          📊 نوار تصمیم امروز (۱۶:۰۰ تا ۲۲:۰۰)
        </h3>

        <div className="flex gap-1 h-16 rounded-xl overflow-hidden mb-2">
          {hourlyRisk.map((h) => (
            <button
              key={h.hour}
              onClick={() => setSelectedHour(h.hour)}
              className={`flex-1 flex flex-col items-center justify-center text-white transition-all hover:opacity-80 ${getRiskColor(h.label)}`}
              aria-label={`ساعت ${h.hour}: ${h.label}`}
            >
              <WeatherIcon code={h.rawData.weatherCode} size="sm" />
              <span className="text-xs font-medium mt-1">{h.hour}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-between text-xs text-text-secondary">
          <span>۱۶:۰۰</span>
          <span>۲۲:۰۰</span>
        </div>
      </GlassCard>

      {/* مودال جزئیات ساعت */}
      {selectedRisk && (
        <Modal
          isOpen={selectedHour !== null}
          onClose={() => setSelectedHour(null)}
          title={`جزئیات ساعت ${selectedHour}:00`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">امتیاز خطر: {Math.round(selectedRisk.risk || 0)}/۱۰۰</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedRisk.label === 'safe' ? 'bg-success/10 text-success' :
                selectedRisk.label === 'caution' ? 'bg-warning/10 text-warning' :
                'bg-danger/10 text-danger'
              }`}>
                {selectedRisk.label === 'safe' ? 'امن' :
                 selectedRisk.label === 'caution' ? 'احتیاط' : 'خطر'}
              </span>
            </div>

            <ProgressBar
              value={selectedRisk.risk || 0}
              variant={selectedRisk.risk! < 30 ? 'success' : selectedRisk.risk! < 60 ? 'warning' : 'danger'}
              size="lg"
            />

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Breakdown:</h4>
              <div className="space-y-1 text-sm">
                <div>🌡️ {selectedRisk.breakdown.cold.detail}</div>
                <div>🌧️ {selectedRisk.breakdown.rain.detail}</div>
                <div>💨 {selectedRisk.breakdown.wind.detail}</div>
                {selectedRisk.breakdown.shock.score > 0 && (
                  <div>⚠️ {selectedRisk.breakdown.shock.detail}</div>
                )}
                {selectedRisk.breakdown.uv.score > 0 && (
                  <div>☀️ {selectedRisk.breakdown.uv.detail}</div>
                )}
              </div>
            </div>

            {selectedRisk.advice.length > 0 && (
              <div className="bg-accent-ghost rounded-xl p-3">
                <p className="text-sm font-medium text-accent">
                  📌 {selectedRisk.advice.join('، ')}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

// ============================================================
// ۶.۳ GoldenWindowCard
// ============================================================
export function GoldenWindowCard() {
  const { decision } = useStore();
  const [showWhy, setShowWhy] = useState(false);

  if (!decision) return null;

  const { goldenWindow, goldenWindowReason, acceptableWindow } = decision;

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  if (!goldenWindow) {
    return (
      <GlassCard level={2} className="mb-4 border-2 border-danger/30">
        <div className="flex items-center gap-3">
          <AlertTriangle size={24} className="text-danger" />
          <div>
            <p className="font-medium text-danger">امروز پنجره امنی نداری</p>
            <p className="text-sm text-text-secondary">شرایط برای بیرون رفتن مناسب نیست</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const durationHours = Math.round(goldenWindow.durationMinutes / 60 * 10) / 10;

  return (
    <>
      <GlassCard level={2} className="mb-4">
        <div className="flex items-start gap-3">
          <Sun size={32} className="text-warning flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-text-secondary mb-1">پنجره طلایی</h3>
            <p className="text-xl font-bold mb-1">
              {formatTime(goldenWindow.start)} تا {formatTime(goldenWindow.end)}
              <span className="text-sm font-normal text-text-secondary mr-2">
                ({durationHours} ساعت)
              </span>
            </p>
            <p className="text-sm text-text-secondary mb-2">{goldenWindowReason}</p>
            <InfoButton onClick={() => setShowWhy(true)} />
          </div>
        </div>

        {acceptableWindow && (
          <div className="mt-3 pt-3 border-t border-white/30">
            <p className="text-xs text-text-secondary">
              بازه قابل قبول: {formatTime(acceptableWindow.start)}–{formatTime(acceptableWindow.end)} (با احتیاط)
            </p>
          </div>
        )}
      </GlassCard>

      <Modal isOpen={showWhy} onClose={() => setShowWhy(false)} title="چرا این پنجره؟">
        <p className="text-sm">{goldenWindowReason}</p>
      </Modal>
    </>
  );
}

// ============================================================
// ۶.۴ DecisionCards
// ============================================================
export function DecisionCards() {
  const { decision } = useStore();
  const [showWhy, setShowWhy] = useState<'go' | 'wear' | 'gear' | null>(null);

  if (!decision) return null;

  const { goDecision, wearAdvice, gearAdvice } = decision;

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const getGoIcon = () => {
    switch (goDecision.action) {
      case 'go': return '🚶';
      case 'go-until': return '⏰';
      case 'go-covered': return '☂️';
      case 'stay-indoor': return '🏠';
    }
  };

  const getGoLabel = () => {
    switch (goDecision.action) {
      case 'go': return 'برو';
      case 'go-until': return `برو تا ${formatTime(goDecision.until!)}`;
      case 'go-covered': return 'سرپوشیده';
      case 'stay-indoor': return 'نرو';
    }
  };

  const getBorderColor = () => {
    switch (goDecision.action) {
      case 'go': return 'border-success/30';
      case 'go-until': return 'border-warning/30';
      case 'go-covered': return 'border-info/30';
      case 'stay-indoor': return 'border-danger/30';
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* کارت خروج */}
        <GlassCard level={2} className={`border-2 ${getBorderColor()}`}>
          <div className="text-center">
            <div className="text-3xl mb-2">{getGoIcon()}</div>
            <div className="text-sm font-medium mb-2">{getGoLabel()}</div>
            <InfoButton onClick={() => setShowWhy('go')} />
          </div>
        </GlassCard>

        {/* کارت پوشش */}
        <GlassCard level={2}>
          <div className="text-center">
            <div className="text-3xl mb-2">👕</div>
            <div className="text-xs font-medium mb-2 line-clamp-2">{wearAdvice?.summary || '—'}</div>
            <InfoButton onClick={() => setShowWhy('wear')} />
          </div>
        </GlassCard>

        {/* کارت تجهیزات */}
        <GlassCard level={2}>
          <div className="text-center">
            <div className="text-3xl mb-2">🎒</div>
            <div className="text-xs font-medium mb-2 line-clamp-2">{gearAdvice?.summary || '—'}</div>
            <InfoButton onClick={() => setShowWhy('gear')} />
          </div>
        </GlassCard>
      </div>

      <Modal
        isOpen={showWhy !== null}
        onClose={() => setShowWhy(null)}
        title={showWhy === 'go' ? 'چرا این تصمیم؟' : showWhy === 'wear' ? 'چرا این پوشش؟' : 'چرا این تجهیزات؟'}
      >
        {showWhy === 'go' && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{goDecision.message}</p>
            {goDecision.reasons.length > 0 && (
              <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
                {goDecision.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </div>
        )}
        {showWhy === 'wear' && wearAdvice && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{wearAdvice.summary}</p>
            {wearAdvice.items.map((item, i) => (
              <div key={i} className="text-sm">• {item.item}: {item.reason}</div>
            ))}
          </div>
        )}
        {showWhy === 'gear' && gearAdvice && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{gearAdvice.summary}</p>
            {gearAdvice.items.map((item, i) => (
              <div key={i} className="text-sm">• {item.reason}</div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}

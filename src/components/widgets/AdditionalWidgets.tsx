import { useStore } from '../../store';
import { GlassCard, Badge } from '../ui';

// ============================================================
// ۶.۱۰ AqiCard (کیفیت هوا — شرطی)
// ============================================================
export function AqiCard() {
  const { decision } = useStore();

  const aqi = decision?.current.aqi;
  if (!aqi) return null;

  const { current } = decision!;

  const toPersian = (n: number) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(Math.round(n)).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
  };

  const getAqiColor = () => {
    if (aqi <= 40) return 'text-success';
    if (aqi <= 60) return 'text-warning';
    if (aqi <= 80) return 'text-orange-500';
    return 'text-danger';
  };

  const getAqiAdvice = () => {
    if (aqi <= 20) return 'کیفیت هوا خوب — مناسب برای همه فعالیت‌ها';
    if (aqi <= 40) return 'کیفیت هوا متوسط — مناسب برای فعالیت‌های عادی';
    if (aqi <= 60) return 'افراد حساس احتیاط کنند';
    if (aqi <= 80) return 'پیاده‌روی طولانی نکنید';
    if (aqi <= 100) return 'ماسک بزنید، از فعالیت طولانی اجتناب کنید';
    return 'در خانه بمانید';
  };

  return (
    <GlassCard level={2} className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🌫️</span>
        <h3 className="text-sm font-medium">کیفیت هوا</h3>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className={`text-4xl font-bold tabular-nums ${getAqiColor()}`}>
          {toPersian(aqi)}
        </div>
        <div>
          <div className={`text-sm font-medium ${getAqiColor()}`}>{current.aqiLabel}</div>
          <div className="text-xs text-text-secondary">شاخص کیفیت هوا</div>
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-2">📌 {getAqiAdvice()}</p>
    </GlassCard>
  );
}

// ============================================================
// ۶.۱۱ FriendComparison (مقایسه با دوستان — شرطی)
// ============================================================
export function FriendComparison() {
  const { decision } = useStore();

  if (!decision?.friendComparison) return null;

  const { friendComparison } = decision;

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const formatWindow = (window: { start: Date; end: Date } | null) => {
    if (!window) return '—';
    return `${formatTime(window.start)} تا ${formatTime(window.end)}`;
  };

  return (
    <GlassCard level={2} className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">👥</span>
        <h3 className="text-sm font-medium">مقایسه با دوستان</h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/30">
          <span className="text-sm">👤 تو:</span>
          <span className="text-sm font-medium text-accent">
            {formatWindow(friendComparison.activeProfileWindow)}
          </span>
        </div>

        {friendComparison.friendProfilesWindows.map((fp) => (
          <div key={fp.profileId} className="flex items-center justify-between p-2 rounded-lg bg-white/30">
            <span className="text-sm">👥 {fp.name}:</span>
            <span className="text-sm font-medium text-success">
              {formatWindow(fp.window)}
            </span>
          </div>
        ))}

        {friendComparison.overlapWindow && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-success/10 border border-success/20">
            <span className="text-sm">🤝 سازش:</span>
            <span className="text-sm font-medium text-success">
              {formatWindow(friendComparison.overlapWindow)}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-text-secondary mt-2">{friendComparison.message}</p>
    </GlassCard>
  );
}

// ============================================================
// ۶.۱۳ WeeklyTrend (روند هفتگی)
// ============================================================
export function WeeklyTrend() {
  const { decision } = useStore();

  if (!decision?.weeklyTrend) return null;

  return (
    <GlassCard level={2} className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">📈</span>
        <h3 className="text-sm font-medium">روند هفتگی</h3>
      </div>
      <p className="text-sm">{decision.weeklyTrend}</p>
    </GlassCard>
  );
}

// ============================================================
// ۶.۱۴ WeekPattern (الگوی هفته)
// ============================================================
export function WeekPattern() {
  const { decision } = useStore();

  if (!decision?.weekPattern) return null;

  return (
    <GlassCard level={2} className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">📊</span>
        <h3 className="text-sm font-medium">الگوی هفته</h3>
      </div>
      <p className="text-sm">{decision.weekPattern}</p>
    </GlassCard>
  );
}

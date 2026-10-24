import { useStore } from '../../store';
import { GlassCard, Badge } from '../ui';
import { CloudRain, AlertTriangle, Moon } from 'lucide-react';

// ============================================================
// ۶.۵ NowcastCard
// ============================================================
export function NowcastCard() {
  const { decision } = useStore();

  if (!decision?.nowcast || decision.nowcast.status === 'no-data') return null;

  const { nowcast } = decision;

  const getBgColor = () => {
    switch (nowcast.status) {
      case 'dry-next-2h': return 'bg-success/10 border-success/20';
      case 'rain-starting-soon': return 'bg-warning/10 border-warning/20';
      case 'raining-now': return 'bg-info/10 border-info/20';
      default: return 'bg-gray-100';
    }
  };

  const getIcon = () => {
    switch (nowcast.status) {
      case 'dry-next-2h': return '☀️';
      case 'rain-starting-soon': return '⏰';
      case 'raining-now': return '🌧️';
      default: return '❓';
    }
  };

  return (
    <GlassCard level={2} className={`mb-4 border-2 ${getBgColor()}`}>
      <div className="flex items-start gap-3">
        <span className="text-3xl">{getIcon()}</span>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-text-secondary mb-1">بارش لحظه‌ای</h3>
          <p className="text-sm font-medium">{nowcast.message}</p>
        </div>
      </div>
    </GlassCard>
  );
}

// ============================================================
// ۶.۶ ShockCard
// ============================================================
export function ShockCard() {
  const { decision } = useStore();

  if (!decision?.temperatureShock) return null;

  const { temperatureShock } = decision;

  const bgColor = temperatureShock.severity === 'high'
    ? 'bg-danger/10 border-danger/30'
    : 'bg-warning/10 border-warning/30';

  return (
    <GlassCard level={2} className={`mb-4 border-2 ${bgColor}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={24} className={temperatureShock.severity === 'high' ? 'text-danger' : 'text-warning'} />
        <div className="flex-1">
          <h3 className="text-sm font-medium mb-1">
            {temperatureShock.severity === 'high' ? 'شوک دمایی شدید' : 'شوک دمایی'}
          </h3>
          <p className="text-sm font-medium">{temperatureShock.message}</p>
        </div>
      </div>
    </GlassCard>
  );
}

// ============================================================
// ۶.۷ AlertsSection
// ============================================================
export function AlertsSection() {
  const { decision } = useStore();

  if (!decision?.alerts || decision.alerts.length === 0) return null;

  const sortedAlerts = [...decision.alerts].sort((a, b) => {
    const severityOrder = { danger: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <GlassCard level={2} className="mb-4">
      <h3 className="text-sm font-medium text-text-secondary mb-3">⚠️ هشدارهای امروز</h3>
      <div className="space-y-2">
        {sortedAlerts.map((alert, i) => {
          const borderColor = alert.severity === 'danger' ? 'border-danger/30' :
                             alert.severity === 'warning' ? 'border-warning/30' :
                             'border-info/30';

          return (
            <div key={i} className={`p-3 rounded-xl border-2 ${borderColor} bg-white/30`}>
              <div className="flex items-start gap-2">
                <span className="text-xl">{alert.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <Badge variant={alert.severity === 'danger' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info'}>
                    {alert.severity === 'danger' ? 'خطر' : alert.severity === 'warning' ? 'هشدار' : 'اطلاعات'}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ============================================================
// ۶.۸ ActivityScores
// ============================================================
export function ActivityScores() {
  const { decision } = useStore();

  if (!decision?.activityScores || decision.activityScores.length === 0) return null;

  const getActivityEmoji = (activity: string) => {
    switch (activity) {
      case 'picnic': return '🧺';
      case 'park': return '🌳';
      case 'walking': return '🚶';
      case 'shopping': return '🛍️';
      case 'sports': return '🏃';
      case 'photography': return '📷';
      default: return '✨';
    }
  };

  const getActivityName = (activity: string) => {
    switch (activity) {
      case 'picnic': return 'پیک‌نیک';
      case 'park': return 'پارک';
      case 'walking': return 'پیاده‌روی';
      case 'shopping': return 'خرید';
      case 'sports': return 'ورزش';
      case 'photography': return 'عکاسی';
      default: return activity;
    }
  };

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <GlassCard level={2} className="mb-4">
      <h3 className="text-sm font-medium text-text-secondary mb-3">📊 امتیاز فعالیت‌ها</h3>
      <div className="space-y-2">
        {decision.activityScores.map((a, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/30">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getActivityEmoji(a.activity)}</span>
              <div>
                <div className="text-sm font-medium">{getActivityName(a.activity)}</div>
                {a.bestWindow && (
                  <div className="text-xs text-text-secondary">
                    بهترین بازه: {formatTime(a.bestWindow.start)}–{formatTime(a.bestWindow.end)}
                  </div>
                )}
              </div>
            </div>
            <Badge variant={a.status === 'good' ? 'success' : a.status === 'caution' ? 'warning' : 'danger'}>
              {a.status === 'good' ? '✅ مناسب' : a.status === 'caution' ? '⚠️ احتیاط' : '❌ نامناسب'}
            </Badge>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ============================================================
// ویجت‌های اضافی (از بخش ۲ سند)
// ============================================================

export function DaylightCard() {
  const { decision } = useStore();

  if (!decision?.daylightInfo) return null;

  const { daylightInfo } = decision;

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const toPersian = (n: number) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(Math.round(n)).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
  };

  return (
    <GlassCard level={2} className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🌅</span>
        <h3 className="text-sm font-medium">خورشید و نور امروز</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>🌄 طلوع: {formatTime(daylightInfo.sunrise)}</div>
        <div>🌇 غروب: {formatTime(daylightInfo.sunset)}</div>
        <div>🌆 گرگ‌ومیش: {formatTime(daylightInfo.civilTwilightEnd)}</div>
        <div>📸 ساعت طلایی: {formatTime(daylightInfo.goldenHourEvening.start)}</div>
      </div>
      <p className="text-xs text-text-secondary mt-2">
        {daylightInfo.isDay
          ? `☀️ روز (${daylightInfo.timeUntilSunset ? toPersian(Math.round(daylightInfo.timeUntilSunset / 60)) : '—'} ساعت تا غروب)`
          : `🌙 شب (${daylightInfo.timeUntilSunrise ? toPersian(Math.round(daylightInfo.timeUntilSunrise / 60)) : '—'} ساعت تا طلوع)`}
      </p>
    </GlassCard>
  );
}

export function CarWashCard() {
  const { decision } = useStore();

  if (!decision?.carWash) return null;

  const { carWash } = decision;

  return (
    <GlassCard level={2} className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🚗</span>
        <h3 className="text-sm font-medium">برنامه‌ریز کارواش</h3>
      </div>
      <p className="text-sm">
        {carWash.recommendation === 'wash' && <span className="text-success font-medium">✅ {carWash.reason}</span>}
        {carWash.recommendation === 'dont-wash' && <span className="text-warning font-medium">⏳ {carWash.reason}</span>}
        {carWash.recommendation === 'covered-parking' && <span className="text-text-secondary font-medium">🅿️ {carWash.reason}</span>}
      </p>
      {carWash.parkingAdvice && (
        <p className="text-xs text-text-secondary mt-1">{carWash.parkingAdvice}</p>
      )}
    </GlassCard>
  );
}

export function PressureCard() {
  const { decision } = useStore();

  if (!decision?.pressure) return null;

  const { pressure } = decision;

  const toPersian = (n: number) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(Math.round(n)).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
  };

  return (
    <GlassCard level={2} className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">📊</span>
        <h3 className="text-sm font-medium">فشار هوا</h3>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold tabular-nums">{toPersian(pressure.value)} hPa</span>
        <span className={`text-sm font-medium ${
          pressure.trend === 'rising' ? 'text-success' :
          pressure.trend === 'falling' ? 'text-warning' :
          'text-text-secondary'
        }`}>
          {pressure.label}
        </span>
      </div>
    </GlassCard>
  );
}

export function NightSkyCard() {
  const { decision } = useStore();

  if (!decision?.nightSky) return null;

  const { nightSky } = decision;

  const toPersian = (n: number) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(Math.round(n)).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
  };

  return (
    <GlassCard level={2} className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Moon size={20} className="text-indigo-400" />
        <h3 className="text-sm font-medium">آسمان شب</h3>
      </div>
      <p className="text-sm">{nightSky.message}</p>
      <p className="text-xs text-text-secondary mt-1">
        فاز ماه: {toPersian(nightSky.moonIllumination)}٪ روشنایی
      </p>
    </GlassCard>
  );
}

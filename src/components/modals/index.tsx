import { useState } from 'react';
import { useStore } from '../../store';
import { Modal, GlassCard, Badge, WeatherIcon, ProgressBar } from '../ui';
import type { HourRisk, ActivityScore } from '../../types';

// Re-export useStore for use in modals
const { useStore: useStoreHook } = { useStore };

// ============================================================
// ۷.۱ HourDetailModal
// ============================================================
export function HourDetailModal() {
  const { decision } = useStore();
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  if (!decision) return null;

  const selectedRisk = selectedHour !== null 
    ? decision.hourlyRisk.find((h) => h.hour === selectedHour) 
    : null;

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
    <>
      {/* این کامپوننت فقط مودال را مدیریت می‌کند */}
      {/* برای باز کردن مودال، باید setSelectedHour را از طریق props یا context فراخوانی کرد */}
      
      {selectedRisk && (
        <Modal
          isOpen={selectedHour !== null}
          onClose={() => setSelectedHour(null)}
          title={`⏰ ساعت ${selectedHour}:00`}
        >
          <div className="space-y-4">
            {/* وضعیت */}
            <div className="flex items-center justify-between">
              <WeatherIcon code={selectedRisk.rawData.weatherCode} size="lg" />
              <Badge variant={
                selectedRisk.label === 'safe' ? 'success' :
                selectedRisk.label === 'caution' ? 'warning' : 'danger'
              }>
                {selectedRisk.label === 'safe' ? '✅ امن' :
                 selectedRisk.label === 'caution' ? '⚠️ احتیاط' : '❌ خطر'}
              </Badge>
            </div>

            {/* امتیاز خطر */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">امتیاز خطر</span>
                <span className="text-2xl font-bold tabular-nums">
                  {selectedRisk.risk !== null ? toPersian(selectedRisk.risk) : '—'}/۱۰۰
                </span>
              </div>
              {selectedRisk.risk !== null && (
                <ProgressBar
                  value={selectedRisk.risk}
                  variant={selectedRisk.risk < 30 ? 'success' : selectedRisk.risk < 60 ? 'warning' : 'danger'}
                  size="lg"
                />
              )}
            </div>

            {/* داده خام */}
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold">داده‌های ساعت:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>🌡️ دما: {toPersian(selectedRisk.rawData.temperature)}°C</div>
                <div>🌡️ احساسی: {toPersian(selectedRisk.rawData.apparentTemperature)}°C</div>
                <div>💧 رطوبت: {toPersian(selectedRisk.rawData.relativeHumidity)}٪</div>
                <div>☁️ ابر: {toPersian(selectedRisk.rawData.cloudCover)}٪</div>
                <div>🌧️ بارش: {toPersian(selectedRisk.rawData.precipitationProbability)}٪</div>
                <div>💨 باد: {toPersian(selectedRisk.rawData.windSpeed)} km/h</div>
                <div>💨 وزش: {toPersian(selectedRisk.rawData.windGusts)} km/h</div>
                <div>☀️ UV: {toPersian(selectedRisk.rawData.uvIndex)}</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold">سهم عوامل در خطر:</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>🌡️ دما:</span>
                  <span className="tabular-nums">+{toPersian(selectedRisk.breakdown.cold.score)}</span>
                </div>
                <div className="flex justify-between">
                  <span>💨 باد:</span>
                  <span className="tabular-nums">+{toPersian(selectedRisk.breakdown.wind.score)}</span>
                </div>
                <div className="flex justify-between">
                  <span>🌧️ بارش:</span>
                  <span className="tabular-nums">+{toPersian(selectedRisk.breakdown.rain.score)}</span>
                </div>
                {selectedRisk.breakdown.shock.score > 0 && (
                  <div className="flex justify-between">
                    <span>⚠️ شوک:</span>
                    <span className="tabular-nums">+{toPersian(selectedRisk.breakdown.shock.score)}</span>
                  </div>
                )}
                {selectedRisk.breakdown.uv.score > 0 && (
                  <div className="flex justify-between">
                    <span>☀️ UV:</span>
                    <span className="tabular-nums">+{toPersian(selectedRisk.breakdown.uv.score)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* توصیه‌ها */}
            {selectedRisk.advice.length > 0 && (
              <div className="bg-accent-ghost rounded-xl p-3">
                <h4 className="text-sm font-semibold mb-2">📌 توصیه‌ها:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {selectedRisk.advice.map((adv, i) => (
                    <li key={i}>{adv}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

// ============================================================
// ۷.۲ ActivityDetailModal
// ============================================================
export function ActivityDetailModal({ activity, onClose }: { activity: ActivityScore | null; onClose: () => void }) {
  if (!activity) return null;

  const getActivityEmoji = (act: string) => {
    switch (act) {
      case 'picnic': return '🧺';
      case 'park': return '🌳';
      case 'walking': return '🚶';
      case 'shopping': return '🛍️';
      case 'sports': return '🏃';
      case 'photography': return '📷';
      default: return '✨';
    }
  };

  const getActivityName = (act: string) => {
    switch (act) {
      case 'picnic': return 'پیک‌نیک';
      case 'park': return 'پارک';
      case 'walking': return 'پیاده‌روی';
      case 'shopping': return 'خرید';
      case 'sports': return 'ورزش';
      case 'photography': return 'عکاسی';
      default: return act;
    }
  };

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`${getActivityEmoji(activity.activity)} ${getActivityName(activity.activity)}`}>
      <div className="space-y-4">
        {/* وضعیت */}
        <div className="flex items-center justify-between">
          <Badge variant={
            activity.status === 'good' ? 'success' :
            activity.status === 'caution' ? 'warning' : 'danger'
          }>
            {activity.status === 'good' ? '✅ مناسب' :
             activity.status === 'caution' ? '⚠️ با احتیاط' : '❌ نامناسب'}
          </Badge>
        </div>

        {/* بهترین بازه */}
        {activity.bestWindow && (
          <div className="bg-success/10 rounded-xl p-3">
            <h4 className="text-sm font-semibold mb-1">بهترین بازه:</h4>
            <p className="text-lg font-bold">
              {formatTime(activity.bestWindow.start)} تا {formatTime(activity.bestWindow.end)}
            </p>
          </div>
        )}

        {/* دلایل */}
        {activity.reasons.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">دلایل:</h4>
            <ul className="space-y-1 text-sm">
              {activity.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-success">✓</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* عوامل محدودکننده */}
        {activity.limitingFactors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">عوامل محدودکننده:</h4>
            <ul className="space-y-1 text-sm">
              {activity.limitingFactors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-warning">⚠️</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ============================================================
// ۷.۳ WhyModal
// ============================================================
export function WhyModal({ title, reasons, onClose }: { title: string; reasons: string[]; onClose: () => void }) {
  return (
    <Modal isOpen={true} onClose={onClose} title={title}>
      <div className="space-y-3">
        {reasons.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-secondary">دلیل خاصی وجود ندارد.</p>
        )}
      </div>
    </Modal>
  );
}

// ============================================================
// ۷.۴ NotificationModal
// ============================================================
export function NotificationModal({ onClose }: { onClose: () => void }) {
  const { profiles, activeProfileId, updateProfile } = useStore();
  const profile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const handleToggle = (enabled: boolean) => {
    updateProfile(profile.id, {
      notifications: { ...profile.notifications, enabled },
    });
  };

  const handleLeadTime = (time: number) => {
    updateProfile(profile.id, {
      notifications: { ...profile.notifications, leadTime: time },
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="تنظیمات اعلان‌ها">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">اعلان‌ها</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.notifications.enabled}
              onChange={(e) => handleToggle(e.target.checked)}
              className="w-5 h-5 rounded accent-accent"
            />
            <span className="text-sm">{profile.notifications.enabled ? 'فعال' : 'غیرفعال'}</span>
          </label>
        </div>

        {profile.notifications.enabled && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">زمان پیش از خروج:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 30, label: '۳۰ دقیقه' },
                  { value: 60, label: '۱ ساعت' },
                  { value: 120, label: '۲ ساعت' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleLeadTime(option.value)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                      profile.notifications.leadTime === option.value
                        ? 'bg-accent text-white'
                        : 'glass-card hover:bg-white/80'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ============================================================
// ۷.۵ AboutModal
// ============================================================
export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="درباره اسکای‌چی">
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-5xl mb-2">🌤️</div>
          <h3 className="text-xl font-bold">اسکای‌چی</h3>
          <p className="text-sm text-text-secondary">دستیار تصمیم هوای بعدازظهر</p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">نسخه:</span>
            <span className="font-medium">۲.۰.۰</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">منبع داده:</span>
            <span className="font-medium">Open-Meteo API</span>
          </div>
        </div>

        <div className="bg-accent-ghost rounded-xl p-3">
          <h4 className="text-sm font-semibold mb-2">حریم خصوصی</h4>
          <p className="text-xs text-text-secondary">
            تمام داده‌های شما (پروفایل، آستانه‌ها) فقط در دستگاه شما ذخیره می‌شوند و به هیچ سروری ارسال نمی‌شوند.
          </p>
        </div>

        <div className="text-center text-xs text-text-tertiary">
          ساخته شده با ❤️ برای ساکنان قرچک
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// مودال تأیید بازنشانی
// ============================================================
export function ResetConfirmModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="بازنشانی تنظیمات">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          آیا مطمئن هستید که می‌خواهید تمام تنظیمات را بازنشانی کنید؟ این عمل قابل بازگشت نیست.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary py-2 rounded-xl text-sm"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-danger text-white rounded-xl text-sm font-medium"
          >
            بله، بازنشانی کن
          </button>
        </div>
      </div>
    </Modal>
  );
}

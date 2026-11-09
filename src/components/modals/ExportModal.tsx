import { useState } from 'react';
import { useStore } from '../../store';
import { Modal, Button } from '../ui';
import { Copy, Check, FileText, Share2 } from 'lucide-react';

// ============================================================
// ExportModal - مودال اشتراک‌گذاری سه سطحی
// ============================================================

interface ExportLevel {
  id: 1 | 2 | 3;
  title: string;
  description: string;
  icon: string;
}

const exportLevels: ExportLevel[] = [
  {
    id: 1,
    title: 'سطح ۱: کامل',
    description: 'تمام اطلاعات هوا، پروفایل، پیشنهادات و داده‌های هفته',
    icon: '📋',
  },
  {
    id: 2,
    title: 'سطح ۲: اطلاعات برنامه',
    description: 'اطلاعات هواشناسی و پیشنهادات ارائه‌شده',
    icon: '🌤️',
  },
  {
    id: 3,
    title: 'سطح ۳: فقط پیشنهادات',
    description: 'پیشنهادات و تصمیمات امروز',
    icon: '💡',
  },
];

export function ExportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
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
    <Modal isOpen={isOpen} onClose={handleClose} title="اشتراک‌گذاری اطلاعات">
      {!selectedLevel ? (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary mb-4">سطح خروجی را انتخاب کنید:</p>
          {exportLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => handleSelectLevel(level.id)}
              className="w-full glass-2 p-4 text-right hover:bg-white/80 transition-all rounded-xl"
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
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                  selectedLevel === level.id
                    ? 'bg-accent text-white'
                    : 'glass-2 hover:bg-white/80'
                }`}
              >
                {level.icon} سطح {level.id}
              </button>
            ))}
          </div>

          <div className="glass-2 p-3 max-h-64 overflow-y-auto rounded-xl">
            <pre className="text-xs whitespace-pre-wrap font-sans leading-6 text-text-primary" dir="rtl">
              {preview}
            </pre>
          </div>

          <Button
            onClick={handleCopy}
            className={`w-full ${copied ? 'bg-success text-white' : ''}`}
          >
            {copied ? (
              <>
                <Check size={18} />
                کپی شد!
              </>
            ) : (
              <>
                <Copy size={18} />
                کپی در کلیپ‌بورد
              </>
            )}
          </Button>

          <button
            onClick={() => {
              setSelectedLevel(null);
              setPreview('');
            }}
            className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← تغییر سطح
          </button>
        </div>
      )}
    </Modal>
  );
}

// ============================================================
// تولید متن خروجی
// ============================================================

function generateExportText(level: 1 | 2 | 3, profile: any, decision: any): string {
  const { current, hourlyRisk, goldenWindow, goldenWindowReason, goDecision, nowcast, temperatureShock, wearAdvice, gearAdvice, activityScores, carWash, daylightInfo, alerts, nightSky, pressure, weeklyTrend, weekPattern } = decision;

  const now = new Date();
  const dateStr = now.toLocaleDateString('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const toPersian = (n: number) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(Math.round(n)).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
  };

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const getGoText = () => {
    switch (goDecision.action) {
      case 'go': return '✅ برو!';
      case 'go-until': return `⏰ برو تا ${formatTime(goDecision.until)}`;
      case 'go-covered': return '☂️ جای سرپوشیده';
      case 'stay-indoor': return '🚫 نرو';
    }
  };

  // سطح ۳: فقط پیشنهادات
  if (level === 3) {
    let text = `💡 پیشنهادات اسکایچی — ${dateStr}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `🚦 تصمیم: ${getGoText()}\n`;
    text += `${goDecision.message}\n\n`;

    if (goldenWindow) {
      text += `☀️ پنجره طلایی: ${formatTime(goldenWindow.start)} تا ${formatTime(goldenWindow.end)}\n\n`;
    }

    if (nowcast && nowcast.status !== 'no-data') {
      text += `🌧️ بارش لحظه‌ای: ${nowcast.message}\n\n`;
    }

    if (temperatureShock) {
      text += `⚠️ شوک دمایی: ${temperatureShock.message}\n\n`;
    }

    text += `📊 ساعت‌های ۱۶-۲۲:\n`;
    hourlyRisk.forEach((h: any) => {
      const emoji = h.label === 'safe' ? '🟢' : h.label === 'caution' ? '🟡' : '🔴';
      text += `  ${emoji} ${h.hour}:00 — خطر ${toPersian(h.risk || 0)}\n`;
      if (h.advice && h.advice.length > 0) {
        text += `     📌 ${h.advice.join('، ')}\n`;
      }
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📱 اسکایچی — دستیار تصمیم هوای بعدازظهر`;
    return text;
  }

  // سطح ۲: اطلاعات برنامه
  if (level === 2) {
    let text = `🌤️ گزارش اسکایچی — ${dateStr}\n`;
    text += `📍 قرچک، تهران\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `🌡️ شرایط فعلی:\n`;
    text += `  دما: ${toPersian(current.temperature)}° | احساسی: ${toPersian(current.apparentTemperature)}°\n`;
    text += `  ${current.temperatureInterpretation}\n`;
    text += `  رطوبت: ${toPersian(current.humidity)}% (${current.humidityLabel})\n`;
    text += `  باد: ${toPersian(current.windSpeed)} km/h | وزش: ${toPersian(current.windGusts)} km/h\n`;
    text += `  احتمال بارش: ${toPersian(current.precipitationProbability)}%\n`;
    text += `  ابر: ${toPersian(current.cloudCover)}% (${current.cloudLabel}) | UV: ${toPersian(current.uvIndex)}\n\n`;

    text += `🚦 تصمیم: ${getGoText()}\n`;
    text += `${goDecision.message}\n\n`;

    if (goldenWindow) {
      text += `☀️ پنجره طلایی: ${formatTime(goldenWindow.start)} تا ${formatTime(goldenWindow.end)}\n`;
      text += `${goldenWindowReason}\n\n`;
    }

    if (nowcast && nowcast.status !== 'no-data') {
      text += `🌧️ بارش لحظه‌ای: ${nowcast.message}\n\n`;
    }

    if (temperatureShock) {
      text += `⚠️ شوک دمایی: ${temperatureShock.message}\n\n`;
    }

    if (wearAdvice) {
      text += `👕 پوشش: ${wearAdvice.summary}\n\n`;
    }

    if (gearAdvice) {
      text += `🎒 تجهیزات: ${gearAdvice.summary}\n\n`;
    }

    if (alerts && alerts.length > 0) {
      text += `⚠️ هشدارها:\n`;
      alerts.forEach((a: any) => {
        text += `  ${a.icon} ${a.message}\n`;
      });
      text += `\n`;
    }

    if (activityScores && activityScores.length > 0) {
      text += `📊 امتیاز فعالیت‌ها:\n`;
      activityScores.forEach((a: any) => {
        const emoji = a.status === 'good' ? '✅' : a.status === 'caution' ? '⚠️' : '❌';
        const name = getActivityName(a.activity);
        text += `  ${emoji} ${name}: ${a.status === 'good' ? 'مناسب' : a.status === 'caution' ? 'با احتیاط' : 'نامناسب'}\n`;
      });
      text += `\n`;
    }

    if (daylightInfo) {
      text += `🌅 خورشید:\n`;
      text += `  طلوع: ${formatTime(daylightInfo.sunrise)} | غروب: ${formatTime(daylightInfo.sunset)}\n`;
      text += `  گرگ‌ومیش: ${formatTime(daylightInfo.civilTwilightEnd)}\n\n`;
    }

    if (carWash) {
      text += `🚗 کارواش: ${carWash.reason}\n\n`;
    }

    text += `📊 ساعت‌های ۱۶-۲۲:\n`;
    hourlyRisk.forEach((h: any) => {
      const emoji = h.label === 'safe' ? '🟢' : h.label === 'caution' ? '🟡' : '🔴';
      text += `  ${emoji} ${h.hour}:00 — خطر ${toPersian(h.risk || 0)}\n`;
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📱 اسکایچی — دستیار تصمیم هوای بعدازظهر`;
    return text;
  }

  // سطح ۱: کامل
  let text = `📋 گزارش کامل اسکایچی\n`;
  text += `${dateStr}\n`;
  text += `📍 قرچک، استان تهران، ایران\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // پروفایل
  text += `👤 پروفایل: ${profile.name}\n`;
  text += `────────────────────\n`;
  text += `آستانه‌ها:\n`;
  text += `  • حساسیت سرما: ${toPersian(profile.coldComfortThreshold)}°C\n`;
  text += `  • حساسیت گرما: ${toPersian(profile.heatThreshold)}°C\n`;
  text += `  • آستانه باد: ${toPersian(profile.windAnnoyThreshold)} km/h\n`;
  text += `  • حمل‌ونقل: ${getTransportLabel(profile.transport)}\n`;
  text += `  • ترجیح زمانی: ${profile.dayNightPreference === 'day' ? 'روز' : profile.dayNightPreference === 'night' ? 'شب' : 'فرقی نمی‌کند'}\n`;
  text += `  • تجهیزات: ${profile.gear.map((g: string) => getGearLabel(g)).join('، ') || 'ندارد'}\n`;
  text += `  • فعالیت‌ها: ${profile.activities.map((a: string) => getActivityName(a)).join('، ')}\n`;
  if (profile.hasCar) {
    text += `  • خودرو: بله (${profile.parking === 'street' ? 'پارک خیابان' : 'پارکینگ سرپوشیده'})\n`;
  }
  if (profile.seasonalAllergy) text += `  • آلرژی فصلی: بله\n`;
  if (profile.jointPain) text += `  • درد مفاصل: بله\n`;
  text += `\n`;

  // شرایط فعلی
  text += `🌡️ شرایط فعلی هوا:\n`;
  text += `────────────────────\n`;
  text += `  ${current.summary}\n`;
  text += `  دمای واقعی: ${toPersian(current.temperature)}°C\n`;
  text += `  دمای احساسی: ${toPersian(current.apparentTemperature)}°C (${current.temperatureInterpretation})\n`;
  text += `  رطوبت: ${toPersian(current.humidity)}% (${current.humidityLabel})\n`;
  text += `  سرعت باد: ${toPersian(current.windSpeed)} km/h (${current.windDirectionLabel})\n`;
  text += `  وزش باد: ${toPersian(current.windGusts)} km/h (${current.windGustLabel})\n`;
  text += `  احتمال بارش: ${toPersian(current.precipitationProbability)}% (${current.precipitationLabel})\n`;
  text += `  پوشش ابر: ${toPersian(current.cloudCover)}% (${current.cloudLabel})\n`;
  text += `  شاخص UV: ${toPersian(current.uvIndex)} (${current.uvLabel})\n`;
  if (current.visibility != null) {
    text += `  دید: ${toPersian(current.visibility)}m (${current.visibilityLabel})\n`;
  }
  if (current.aqi != null) {
    text += `  کیفیت هوا: AQI ${toPersian(current.aqi)} (${current.aqiLabel})\n`;
  }
  text += `\n`;

  // تصمیم
  text += `🚦 تصمیم:\n`;
  text += `────────────────────\n`;
  text += `  ${getGoText()}\n`;
  text += `  ${goDecision.message}\n\n`;

  if (goldenWindow) {
    text += `☀️ پنجره طلایی: ${formatTime(goldenWindow.start)} تا ${formatTime(goldenWindow.end)}\n`;
    text += `  ${goldenWindowReason}\n\n`;
  }

  // Nowcast
  if (nowcast && nowcast.status !== 'no-data') {
    text += `🌧️ بارش لحظه‌ای:\n`;
    text += `────────────────────\n`;
    text += `  ${nowcast.message}\n\n`;
  }

  // شوک دمایی
  if (temperatureShock) {
    text += `⚠️ شوک دمایی:\n`;
    text += `────────────────────\n`;
    text += `  ${temperatureShock.message}\n`;
    text += `  شدت: ${temperatureShock.severity === 'high' ? 'بالا' : 'متوسط'}\n\n`;
  }

  // پوشش و تجهیزات
  if (wearAdvice) {
    text += `👕 پوشش پیشنهادی:\n`;
    text += `────────────────────\n`;
    text += `  ${wearAdvice.summary}\n\n`;
  }

  if (gearAdvice) {
    text += `🎒 تجهیزات پیشنهادی:\n`;
    text += `────────────────────\n`;
    text += `  ${gearAdvice.summary}\n\n`;
  }

  // هشدارها
  if (alerts && alerts.length > 0) {
    text += `⚠️ هشدارها:\n`;
    text += `────────────────────\n`;
    alerts.forEach((a: any) => {
      text += `  ${a.icon} ${a.message} [${a.severity === 'danger' ? 'خطر' : a.severity === 'warning' ? 'هشدار' : 'اطلاعات'}]\n`;
    });
    text += `\n`;
  }

  // فعالیت‌ها
  if (activityScores && activityScores.length > 0) {
    text += `📊 امتیاز فعالیت‌ها:\n`;
    text += `────────────────────\n`;
    activityScores.forEach((a: any) => {
      const emoji = a.status === 'good' ? '✅' : a.status === 'caution' ? '⚠️' : '❌';
      const name = getActivityName(a.activity);
      text += `  ${emoji} ${name}: ${a.status === 'good' ? 'مناسب' : a.status === 'caution' ? 'با احتیاط' : 'نامناسب'}\n`;
      if (a.bestWindow) {
        text += `     بهترین بازه: ${formatTime(a.bestWindow.start)}–${formatTime(a.bestWindow.end)}\n`;
      }
      if (a.limitingFactors && a.limitingFactors.length > 0) {
        text += `     محدودکننده: ${a.limitingFactors.join('، ')}\n`;
      }
    });
    text += `\n`;
  }

  // خورشید
  if (daylightInfo) {
    text += `🌅 خورشید و نور:\n`;
    text += `────────────────────\n`;
    text += `  طلوع: ${formatTime(daylightInfo.sunrise)}\n`;
    text += `  غروب: ${formatTime(daylightInfo.sunset)}\n`;
    text += `  گرگ‌ومیش: ${formatTime(daylightInfo.civilTwilightEnd)}\n`;
    text += `  ساعت طلایی عصر: ${formatTime(daylightInfo.goldenHourEvening.start)}–${formatTime(daylightInfo.goldenHourEvening.end)}\n`;
    text += `  وضعیت: ${daylightInfo.isDay ? '☀️ روز' : '🌙 شب'}\n\n`;
  }

  // کارواش
  if (carWash) {
    text += `🚗 کارواش:\n`;
    text += `────────────────────\n`;
    text += `  توصیه: ${carWash.recommendation === 'wash' ? '✅ بشور' : carWash.recommendation === 'dont-wash' ? '⏳ نشور' : '🅿️ زیر سقف'}\n`;
    text += `  ${carWash.reason}\n`;
    if (carWash.parkingAdvice) {
      text += `  ${carWash.parkingAdvice}\n`;
    }
    text += `\n`;
  }

  // فشار هوا
  if (pressure) {
    text += `📊 فشار هوا:\n`;
    text += `────────────────────\n`;
    text += `  ${toPersian(pressure.value)} hPa — ${pressure.label}\n\n`;
  }

  // آسمان شب
  if (nightSky) {
    text += `🌙 آسمان شب:\n`;
    text += `────────────────────\n`;
    text += `  ${nightSky.message}\n`;
    text += `  فاز ماه: ${toPersian(nightSky.moonIllumination)}٪ روشنایی\n\n`;
  }

  // روند هفتگی
  if (weeklyTrend) {
    text += `📈 روند هفتگی:\n`;
    text += `────────────────────\n`;
    text += `  ${weeklyTrend}\n\n`;
  }

  // الگوی هفته
  if (weekPattern) {
    text += `📊 الگوی هفته:\n`;
    text += `────────────────────\n`;
    text += `  ${weekPattern}\n\n`;
  }

  // ساعت‌های ۱۶-۲۲ با breakdown
  text += `📊 نوار تصمیم (۱۶:۰۰ تا ۲۲:۰۰):\n`;
  text += `────────────────────\n`;
  hourlyRisk.forEach((h: any) => {
    const emoji = h.label === 'safe' ? '🟢' : h.label === 'caution' ? '🟡' : '🔴';
    text += `  ${emoji} ${h.hour}:00 — امتیاز خطر: ${toPersian(h.risk || 0)}/۱۰۰\n`;
    text += `     🌡️ ${h.breakdown.cold.detail} → +${toPersian(h.breakdown.cold.score)}\n`;
    text += `     🌧️ ${h.breakdown.rain.detail} → +${toPersian(h.breakdown.rain.score)}\n`;
    text += `     💨 ${h.breakdown.wind.detail} → +${toPersian(h.breakdown.wind.score)}\n`;
    if (h.breakdown.shock.score > 0) {
      text += `     ⚠️ ${h.breakdown.shock.detail} → +${toPersian(h.breakdown.shock.score)}\n`;
    }
    if (h.advice && h.advice.length > 0) {
      text += `     📌 توصیه: ${h.advice.join('، ')}\n`;
    }
  });
  text += `\n`;

  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📱 اسکایچی — دستیار تصمیم هوای بعدازظهر\n`;
  text += `داده‌ها: Open-Meteo API\n`;
  text += `نسخه ۲.۰`;

  return text;
}

// توابع کمکی
function getTransportLabel(t: string): string {
  switch (t) {
    case 'walking': return 'پیاده';
    case 'car': return 'ماشین';
    case 'bike': return 'دوچرخه';
    case 'motorcycle': return 'موتور';
    case 'public': return 'حمل‌ونقل عمومی';
    default: return t;
  }
}

function getGearLabel(e: string): string {
  switch (e) {
    case 'umbrella': return 'چتر';
    case 'raincoat': return 'بارانی';
    case 'jacket': return 'کاپشن';
    case 'hat': return 'کلاه';
    case 'gloves': return 'دستکش';
    case 'sunscreen': return 'ضدآفتاب';
    default: return e;
  }
}

function getActivityName(a: string): string {
  switch (a) {
    case 'park': return 'پارک';
    case 'walking': return 'پیاده‌روی';
    case 'picnic': return 'پیک‌نیک';
    case 'shopping': return 'خرید';
    case 'sports': return 'ورزش';
    case 'photography': return 'عکاسی';
    default: return a;
  }
}

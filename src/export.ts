import { useStore } from './store';
import type { UserProfile, WeatherData, DecisionOutput } from './types';

export interface ExportLevel {
  id: 1 | 2 | 3;
  title: string;
  description: string;
  icon: string;
}

export const exportLevels: ExportLevel[] = [
  { id: 1, title: 'سطح ۱: کامل', description: 'تمام اطلاعات هوا، پروفایل کاربر، پیشنهادات و داده‌های هفته', icon: '📋' },
  { id: 2, title: 'سطح ۲: اطلاعات برنامه', description: 'اطلاعات هواشناسی و پیشنهادات ارائه‌شده', icon: '🌤️' },
  { id: 3, title: 'سطح ۳: فقط پیشنهادات', description: 'پیشنهادات و تصمیمات امروز', icon: '💡' },
];

function toPersianNum(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

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

function getActivityLabel(a: string): string {
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

export function generateExportText(
  level: 1 | 2 | 3,
  profile: UserProfile,
  decision: DecisionOutput
): string {
  const { current, hourlyRisk, goldenWindow, goDecision } = decision;

  const now = new Date();
  const dateStr = now.toLocaleDateString('fa-IR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const goOutText = goDecision.action === 'go' ? '✅ برو!' :
                    goDecision.action === 'go-until' ? `⏰ برو تا ${formatTime(goDecision.until!)}` :
                    goDecision.action === 'go-covered' ? '☂️ جای سرپوشیده' : '🚫 نرو';

  // Level 3: Only suggestions
  if (level === 3) {
    let text = `💡 پیشنهادات اسکایچی — ${dateStr}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `🚦 تصمیم: ${goOutText}\n`;

    if (goldenWindow) {
      text += `☀️ پنجره طلایی: ${formatTime(goldenWindow.start)} تا ${formatTime(goldenWindow.end)}\n\n`;
    }

    text += `\n📊 ساعت‌های ۱۶-۲۲:\n`;
    hourlyRisk.forEach((h) => {
      const emoji = h.label === 'safe' ? '🟢' : h.label === 'caution' ? '🟡' : '🔴';
      text += `  ${emoji} ${h.hour}:00 — خطر ${toPersianNum(h.risk || 0)}\n`;
      if (h.advice.length > 0) {
        text += `     📌 ${h.advice.join('، ')}\n`;
      }
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📱 اسکایچی — دستیار تصمیم هوای بعدازظهر`;
    return text;
  }

  // Level 2: Weather info + suggestions
  if (level === 2) {
    let text = `🌤️ گزارش اسکایچی — ${dateStr}\n`;
    text += `📍 قرچک، تهران\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `🌡️ شرایط فعلی:\n`;
    text += `  دما: ${toPersianNum(Math.round(current.temperature))}° | احساسی: ${toPersianNum(Math.round(current.apparentTemperature))}°\n`;
    text += `  رطوبت: ${toPersianNum(current.humidity)}% (${current.humidityLabel})\n`;
    text += `  باد: ${toPersianNum(Math.round(current.windSpeed))} km/h | وزش: ${toPersianNum(Math.round(current.windGusts))} km/h\n`;
    text += `  احتمال بارش: ${toPersianNum(current.precipitationProbability)}%\n`;
    text += `  ابر: ${toPersianNum(current.cloudCover)}% (${current.cloudLabel}) | UV: ${toPersianNum(Math.round(current.uvIndex))}\n\n`;

    text += `🚦 تصمیم: ${goOutText}\n`;
    text += `${goDecision.message}\n\n`;

    if (goldenWindow) {
      text += `☀️ پنجره طلایی: ${formatTime(goldenWindow.start)} تا ${formatTime(goldenWindow.end)}\n`;
      text += `${decision.goldenWindowReason}\n\n`;
    }

    text += `📊 ساعت‌های ۱۶-۲۲:\n`;
    hourlyRisk.forEach((h) => {
      const emoji = h.label === 'safe' ? '🟢' : h.label === 'caution' ? '🟡' : '🔴';
      text += `  ${emoji} ${h.hour}:00 — خطر ${toPersianNum(h.risk || 0)}\n`;
      if (h.advice.length > 0) {
        text += `     📌 ${h.advice.join('، ')}\n`;
      }
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📱 اسکایچی — دستیار تصمیم هوای بعدازظهر`;
    return text;
  }

  // Level 1: Full report
  let text = `📋 گزارش کامل اسکایچی\n`;
  text += `${dateStr}\n`;
  text += `📍 قرچک، استان تهران، ایران\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Profile
  text += `👤 پروفایل: ${profile.name}\n`;
  text += `────────────────────\n`;
  text += `آستانه‌ها:\n`;
  text += `  • حساسیت سرما: ${toPersianNum(profile.coldComfortThreshold)}°C\n`;
  text += `  • حساسیت گرما: ${toPersianNum(profile.heatThreshold)}°C\n`;
  text += `  • آستانه باد: ${toPersianNum(profile.windAnnoyThreshold)} km/h\n`;
  text += `  • نسیم آزاردهنده: ${toPersianNum(profile.breezeAnnoyThreshold)} km/h\n`;
  text += `  • حمل‌ونقل: ${getTransportLabel(profile.transport)}\n`;
  text += `  • ترجیح زمانی: ${profile.dayNightPreference === 'day' ? 'روز' : profile.dayNightPreference === 'night' ? 'شب' : 'فرقی نمی‌کند'}\n`;
  text += `  • تجهیزات: ${profile.gear.map(getGearLabel).join('، ') || 'ندارد'}\n`;
  text += `  • فعالیت‌ها: ${profile.activities.map(getActivityLabel).join('، ')}\n`;
  if (profile.hasCar) {
    text += `  • خودرو: بله (${profile.parking === 'street' ? 'پارک خیابان' : 'پارکینگ سرپوشیده'})\n`;
  }
  if (profile.seasonalAllergy) text += `  • آلرژی فصلی: بله\n`;
  if (profile.jointPain) text += `  • درد مفاصل: بله\n`;
  text += `\n`;

  // Current conditions
  text += `🌡️ شرایط فعلی هوا:\n`;
  text += `────────────────────\n`;
  text += `  ${current.summary}\n`;
  text += `  دمای واقعی: ${toPersianNum(Math.round(current.temperature))}°C\n`;
  text += `  دمای احساسی: ${toPersianNum(Math.round(current.apparentTemperature))}°C (${current.temperatureInterpretation})\n`;
  text += `  رطوبت: ${toPersianNum(current.humidity)}% (${current.humidityLabel})\n`;
  text += `  سرعت باد: ${toPersianNum(Math.round(current.windSpeed))} km/h (${current.windDirectionLabel})\n`;
  text += `  وزش باد: ${toPersianNum(Math.round(current.windGusts))} km/h (${current.windGustLabel})\n`;
  text += `  احتمال بارش: ${toPersianNum(current.precipitationProbability)}% (${current.precipitationLabel})\n`;
  text += `  پوشش ابر: ${toPersianNum(current.cloudCover)}% (${current.cloudLabel})\n`;
  text += `  شاخص UV: ${toPersianNum(Math.round(current.uvIndex))} (${current.uvLabel})\n\n`;

  // Decision
  text += `🚦 تصمیم:\n`;
  text += `────────────────────\n`;
  text += `  ${goOutText}\n`;
  text += `  ${goDecision.message}\n\n`;

  if (goldenWindow) {
    text += `☀️ پنجره طلایی: ${formatTime(goldenWindow.start)} تا ${formatTime(goldenWindow.end)}\n`;
    text += `  ${decision.goldenWindowReason}\n\n`;
  }

  // Hourly risk with breakdown
  text += `📊 نوار تصمیم (۱۶:۰۰ تا ۲۲:۰۰):\n`;
  text += `────────────────────\n`;
  hourlyRisk.forEach((h) => {
    const emoji = h.label === 'safe' ? '🟢' : h.label === 'caution' ? '🟡' : '🔴';
    text += `  ${emoji} ${h.hour}:00 — امتیاز خطر: ${toPersianNum(h.risk || 0)}/۱۰۰\n`;
    text += `     🌡️ ${h.breakdown.cold.detail} → +${toPersianNum(Math.round(h.breakdown.cold.score))}\n`;
    text += `     🌧️ ${h.breakdown.rain.detail} → +${toPersianNum(Math.round(h.breakdown.rain.score))}\n`;
    text += `     💨 ${h.breakdown.wind.detail} → +${toPersianNum(Math.round(h.breakdown.wind.score))}\n`;
    if (h.breakdown.shock.score > 0) {
      text += `     ⚠️ ${h.breakdown.shock.detail} → +${toPersianNum(Math.round(h.breakdown.shock.score))}\n`;
    }
    if (h.advice.length > 0) {
      text += `     📌 توصیه: ${h.advice.join('، ')}\n`;
    }
  });
  text += `\n`;

  // Weekly
  text += `📅 پیش‌بینی هفته:\n`;
  text += `────────────────────\n`;
  if (decision.weekRanking && decision.weekRanking.length > 0) {
    decision.weekRanking.forEach((d) => {
      const emoji = d.status === 'good' ? '✅' : d.status === 'caution' ? '⚠️' : '❌';
      text += `  ${emoji} ${d.label || d.date.toLocaleDateString('fa-IR')} — امتیاز: ${toPersianNum(d.score)}\n`;
    });
  } else {
    text += `  (در نسخه ۲.۰ — بخش ۲ کامل می‌شود)\n`;
  }
  text += `\n`;

  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📱 اسکایچی — دستیار تصمیم هوای بعدازظهر\n`;
  text += `داده‌ها: Open-Meteo API\n`;
  text += `نسخه ۲.۰`;

  return text;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

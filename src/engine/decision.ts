// ============================================================
// اسکای‌چی نسخه ۲.۰ — تصمیم خروج زمان‌دار
// ============================================================

import type { TimeWindow, HourRisk, UserProfile, DailyData, GoDecision } from '../types';

export function calculateGoDecision(
  goldenWindow: TimeWindow | null,
  acceptableWindow: TimeWindow | null,
  hourlyRisk: HourRisk[],
  profile: UserProfile,
  daily: DailyData
): GoDecision {
  const sunset = daily.sunset;

  // حالت ۱: پنجره طلایی با مدت ≥ ۶۰ دقیقه
  if (goldenWindow && goldenWindow.durationMinutes >= 60) {
    // اگر ترجیح روز است و پنجره قبل از غروب تمام می‌شود
    if (profile.dayNightPreference === 'day') {
      const sunsetLimit = new Date(sunset.getTime() - 90 * 60 * 1000);
      if (goldenWindow.end <= sunsetLimit) {
        // تمام بازه در روز است
        return {
          action: 'go',
          message: '✅ برو — شرایط برای بیرون رفتن مطلوب است.',
          until: null,
          reasons: extractReasons(goldenWindow, hourlyRisk),
        };
      } else {
        // بعد از پنجره خطر افزایش می‌یابد
        const afterReason = getAfterWindowReason(goldenWindow, hourlyRisk);
        return {
          action: 'go-until',
          message: `✅ برو — اما ترجیحاً تا ${formatTime(goldenWindow.end)} (پنجره طلایی). بعد از آن ${afterReason}.`,
          until: goldenWindow.end,
          reasons: [...extractReasons(goldenWindow, hourlyRisk), afterReason],
        };
      }
    } else {
      // ترجیح any یا night
      return {
        action: 'go',
        message: '✅ برو — شرایط برای بیرون رفتن مطلوب است.',
        until: null,
        reasons: extractReasons(goldenWindow, hourlyRisk),
      };
    }
  }

  // حالت ۲: بدون پنجره طلایی اما پنجره قابل قبول ≥ ۹۰ دقیقه
  if (acceptableWindow && acceptableWindow.durationMinutes >= 90) {
    if (profile.transport === 'walking' && profile.activities.includes('park')) {
      return {
        action: 'go-covered',
        message: '☂️ می‌توانی بروی اما جای سرپوشیده (گیم‌نت، کافه) بهتر است.',
        until: acceptableWindow.end,
        reasons: extractReasons(acceptableWindow, hourlyRisk),
      };
    } else {
      const afterReason = getAfterWindowReason(acceptableWindow, hourlyRisk);
      return {
        action: 'go-until',
        message: `✅ برو — اما ترجیحاً تا ${formatTime(acceptableWindow.end)}. بعد از آن ${afterReason}.`,
        until: acceptableWindow.end,
        reasons: [...extractReasons(acceptableWindow, hourlyRisk), afterReason],
      };
    }
  }

  // حالت ۳: هیچ پنجره‌ای نیست
  const mainReason = getMainStayReason(hourlyRisk);
  return {
    action: 'stay-indoor',
    message: `❌ امروز برای بیرون رفتن مناسب نیست. ${mainReason}.`,
    until: null,
    reasons: [mainReason],
  };
}

// ----- توابع کمکی -----
function extractReasons(window: TimeWindow, hourlyRisk: HourRisk[]): string[] {
  const reasons: string[] = [];
  const windowHours = hourlyRisk.filter((h) => {
    const t = h.time.getTime();
    return t >= window.start.getTime() && t < window.end.getTime();
  });

  if (windowHours.length === 0) return reasons;

  const avgTemp = windowHours.reduce((sum, h) => sum + h.rawData.apparentTemperature, 0) / windowHours.length;
  const avgPrecip = windowHours.reduce((sum, h) => sum + h.rawData.precipitationProbability, 0) / windowHours.length;
  const avgWind = windowHours.reduce((sum, h) => sum + h.rawData.windGusts, 0) / windowHours.length;

  reasons.push(`دمای احساسی ${Math.round(avgTemp)}°C`);
  reasons.push(`بارش ${Math.round(avgPrecip)}٪`);
  reasons.push(`باد ${Math.round(avgWind)} km/h`);

  return reasons;
}

function getAfterWindowReason(window: TimeWindow, hourlyRisk: HourRisk[]): string {
  const afterHour = hourlyRisk.find((h) => h.time.getTime() >= window.end.getTime());
  if (!afterHour) return 'شرایط نامشخص';

  const parts: string[] = [];
  if (afterHour.breakdown.cold.score > 15) {
    parts.push(afterHour.breakdown.cold.detail);
  }
  if (afterHour.breakdown.wind.score > 15) {
    parts.push(afterHour.breakdown.wind.detail);
  }
  if (afterHour.breakdown.rain.score > 15) {
    parts.push(afterHour.breakdown.rain.detail);
  }

  return parts.length > 0 ? parts.join('، ') : 'افزایش خطر';
}

function getMainStayReason(hourlyRisk: HourRisk[]): string {
  if (hourlyRisk.length === 0) return 'داده کافی در دسترس نیست';

  // پیدا کردن بدترین ساعت
  const worst = hourlyRisk.reduce((max, h) => {
    const r = h.risk || 0;
    const maxR = max.risk || 0;
    return r > maxR ? h : max;
  }, hourlyRisk[0]);

  const parts: string[] = [];
  if (worst.breakdown.cold.score > 30) parts.push('سرد بودن هوا');
  if (worst.breakdown.rain.score > 30) parts.push('احتمال بارش');
  if (worst.breakdown.wind.score > 30) parts.push('باد شدید');

  return parts.length > 0 ? parts.join(' و ') : 'شرایط نامساعد';
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

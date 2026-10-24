// ============================================================
// اسکای‌چی نسخه ۲.۰ — پنجره طلایی و پنجره قابل قبول
// ============================================================

import type { HourRisk, TimeWindow, UserProfile, DailyData } from '../types';

interface WindowResult {
  window: TimeWindow | null;
  reason: string;
}

// ----- findGoldenWindow -----
export function findGoldenWindow(
  hourlyRisk: HourRisk[],
  daily: DailyData,
  profile: UserProfile
): WindowResult {
  // ساعت‌های سبز (risk < 30)
  const safeHours = hourlyRisk.filter((h) => h.risk !== null && h.risk < 30);

  if (safeHours.length === 0) {
    return { window: null, reason: 'هیچ ساعت امنی در بازه ۱۶-۲۲ وجود ندارد.' };
  }

  // گروه‌بندی به بازه‌های پیوسته
  const windows: TimeWindow[] = [];
  let currentWindow: HourRisk[] = [safeHours[0]];

  for (let i = 1; i < safeHours.length; i++) {
    const prev = safeHours[i - 1];
    const curr = safeHours[i];
    // اگر ساعت‌ها پیوسته باشند (اختلاف ۱ ساعت)
    if (curr.hour - prev.hour === 1) {
      currentWindow.push(curr);
    } else {
      // ذخیره پنجره قبلی و شروع جدید
      windows.push(createTimeWindow(currentWindow));
      currentWindow = [curr];
    }
  }
  windows.push(createTimeWindow(currentWindow));

  // طولانی‌ترین بازه
  const longest = windows.reduce((max, w) => (w.durationMinutes > max.durationMinutes ? w : max), windows[0]);

  // اعمال ترجیح روز/شب
  let finalWindow = longest;
  const sunset = daily.sunset;

  if (profile.dayNightPreference === 'day') {
    // باید حداقل ۹۰ دقیقه قبل از غروب تمام شود
    const limitEnd = new Date(sunset.getTime() - 90 * 60 * 1000);
    if (longest.end > limitEnd) {
      // محدود کردن end
      const adjustedEnd = limitEnd;
      const duration = (adjustedEnd.getTime() - longest.start.getTime()) / (60 * 1000);
      if (duration >= 60) {
        finalWindow = {
          start: longest.start,
          end: adjustedEnd,
          durationMinutes: duration,
          averageRisk: longest.averageRisk,
        };
      } else {
        // بازه خیلی کوتاه شد
        return { window: null, reason: 'پنجره طلایی کافی قبل از غروب وجود ندارد.' };
      }
    }
  }

  // بررسی حداقل مدت
  if (finalWindow.durationMinutes < 60) {
    return { window: null, reason: 'پنجره طلایی کمتر از ۶۰ دقیقه است.' };
  }

  // تولید دلیل
  const reason = generateGoldenWindowReason(finalWindow, hourlyRisk);

  return { window: finalWindow, reason };
}

// ----- findAcceptableWindow -----
export function findAcceptableWindow(
  hourlyRisk: HourRisk[],
  profile: UserProfile
): TimeWindow | null {
  // ساعت‌های زرد (30 <= risk < 60)
  const cautionHours = hourlyRisk.filter((h) => h.risk !== null && h.risk >= 30 && h.risk < 60);

  if (cautionHours.length === 0) return null;

  // گروه‌بندی
  const windows: TimeWindow[] = [];
  let currentWindow: HourRisk[] = [cautionHours[0]];

  for (let i = 1; i < cautionHours.length; i++) {
    const prev = cautionHours[i - 1];
    const curr = cautionHours[i];
    if (curr.hour - prev.hour === 1) {
      currentWindow.push(curr);
    } else {
      windows.push(createTimeWindow(currentWindow));
      currentWindow = [curr];
    }
  }
  windows.push(createTimeWindow(currentWindow));

  // طولانی‌ترین بازه
  const longest = windows.reduce((max, w) => (w.durationMinutes > max.durationMinutes ? w : max), windows[0]);

  // حداقل ۹۰ دقیقه
  if (longest.durationMinutes < 90) return null;

  return longest;
}

// ----- توابع کمکی -----
function createTimeWindow(hours: HourRisk[]): TimeWindow {
  const start = hours[0].time;
  const end = new Date(hours[hours.length - 1].time.getTime() + 60 * 60 * 1000); // +1 ساعت برای آخرین ساعت
  const durationMinutes = (end.getTime() - start.getTime()) / (60 * 1000);
  const avgRisk = hours.reduce((sum, h) => sum + (h.risk || 0), 0) / hours.length;

  return { start, end, durationMinutes, averageRisk: avgRisk };
}

function generateGoldenWindowReason(window: TimeWindow, allRisks: HourRisk[]): string {
  const startHour = window.start.getHours();
  const endHour = window.end.getHours();

  // پیدا کردن ساعت‌های داخل بازه
  const windowHours = allRisks.filter((h) => {
    const hourTime = h.time.getTime();
    return hourTime >= window.start.getTime() && hourTime < window.end.getTime();
  });

  if (windowHours.length === 0) {
    return `پنجره طلایی ${formatTime(window.start)} تا ${formatTime(window.end)}`;
  }

  // میانگین breakdown
  const avgTemp = windowHours.reduce((sum, h) => sum + h.rawData.apparentTemperature, 0) / windowHours.length;
  const avgPrecip = windowHours.reduce((sum, h) => sum + h.rawData.precipitationProbability, 0) / windowHours.length;
  const avgWind = windowHours.reduce((sum, h) => sum + h.rawData.windGusts, 0) / windowHours.length;

  let reason = `پنجره طلایی ${formatTime(window.start)} تا ${formatTime(window.end)} (${Math.round(window.durationMinutes / 60 * 10) / 10} ساعت). `;
  reason += `چرا؟ دمای احساسی ${Math.round(avgTemp)}°C، بارش ${Math.round(avgPrecip)}٪، باد ${Math.round(avgWind)} km/h.`;

  // دلیل بعد از پنجره
  const afterWindow = allRisks.find((h) => h.time.getTime() >= window.end.getTime());
  if (afterWindow && afterWindow.risk !== null && afterWindow.risk >= 30) {
    reason += ` بعد از ${formatTime(window.end)}: ${afterWindow.breakdown.cold.detail}، ${afterWindow.breakdown.wind.detail}.`;
  }

  return reason;
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ----- generateGoldenWindowReasonString (خروجی کامل) -----
export function generateGoldenWindowReasonString(
  window: TimeWindow | null,
  reason: string
): string {
  if (!window) return reason;
  return reason;
}

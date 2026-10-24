// ============================================================
// اسکای‌چی نسخه ۲.۰ — فشار هوا و روند
// ============================================================

import type { HourlyData, PressureInfo } from '../types';

export function computePressure(
  hourly: HourlyData[],
  now: Date
): PressureInfo | null {
  // گام ۱: بررسی داده
  const currentHour = hourly.find((h) => h.hour === now.getHours());
  if (!currentHour || currentHour.surfacePressure == null) {
    return null;
  }

  const current = currentHour.surfacePressure;

  // گام ۳: ۳ ساعت گذشته
  const past3h = hourly.filter((h) => {
    const diff = (now.getTime() - h.time.getTime()) / (60 * 60 * 1000);
    return diff > 0 && diff <= 3 && h.surfacePressure != null;
  });

  // گام ۴: ۳ ساعت آینده
  const future3h = hourly.filter((h) => {
    const diff = (h.time.getTime() - now.getTime()) / (60 * 60 * 1000);
    return diff > 0 && diff <= 3 && h.surfacePressure != null;
  });

  if (past3h.length === 0 || future3h.length === 0) {
    return null;
  }

  const past = past3h.reduce((sum, h) => sum + (h.surfacePressure ?? 0), 0) / past3h.length;
  const future = future3h.reduce((sum, h) => sum + (h.surfacePressure ?? 0), 0) / future3h.length;

  // گام ۵: روند
  let trend: 'rising' | 'falling' | 'steady';
  let label: string;

  if (future - current > 2 && current - past > 2) {
    trend = 'rising';
    label = 'افزایشی — هوا در حال بهبود';
  } else if (future - current < -2 && current - past < -2) {
    trend = 'falling';
    label = 'کاهشی — احتمال تغییر هوا';
  } else {
    trend = 'steady';
    label = 'ثابت';
  }

  return {
    value: current,
    trend,
    label,
  };
}

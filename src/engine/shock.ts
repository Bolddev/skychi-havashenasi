// ============================================================
// اسکای‌چی نسخه ۲.۰ — شوک دمایی
// ============================================================

import type { HourlyData, ShockWarning } from '../types';

export function detectTemperatureShock(
  today: HourlyData[],
  yesterday: HourlyData[] | null | undefined
): ShockWarning | null {
  // گام ۱: بررسی داده دیروز
  if (!yesterday || yesterday.length === 0) {
    return null;
  }

  let maxShock = 0;
  let shockHour: number | null = null;

  // گام ۳: بررسی ساعت‌های ۱۶-۲۲
  for (let hour = 16; hour <= 22; hour++) {
    const todayH = today.find((h) => h.hour === hour);
    const yesterdayH = yesterday.find((h) => h.hour === hour);

    if (!todayH || !yesterdayH) continue;

    // گام ۳: محاسبه اختلاف
    const diff = yesterdayH.apparentTemperature - todayH.apparentTemperature;

    // گام ۳: پیدا کردن بیشترین شوک
    if (Math.abs(diff) > Math.abs(maxShock)) {
      maxShock = diff;
      shockHour = hour;
    }
  }

  // گام ۴: اگر شوک کمتر از ۵ درجه است
  if (shockHour === null || Math.abs(maxShock) < 5) {
    return null;
  }

  // گام ۵: شدت
  const severity = Math.abs(maxShock) >= 8 ? 'high' : 'medium';

  // گام ۶: جهت
  const direction = maxShock > 0 ? 'colder' : 'warmer';

  // گام ۷: پیام
  let message: string;
  if (direction === 'colder') {
    message = `امروز ${shockHour}:00 حدود ${Math.round(Math.abs(maxShock))} درجه سردتر از دیروز است. کاپشن بردار.`;
  } else {
    message = `امروز ${shockHour}:00 حدود ${Math.round(Math.abs(maxShock))} درجه گرم‌تر از دیروز است.`;
  }

  return {
    magnitude: Math.round(Math.abs(maxShock)),
    direction,
    hour: shockHour,
    message,
    severity,
  };
}

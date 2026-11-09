// ============================================================
// اسکای‌چی نسخه ۲.۰ — آسمان شب و فاز ماه
// ============================================================

import type { HourlyData, NightSkyInfo } from '../types';

export function computeNightSky(
  hourly: HourlyData[],
  now: Date,
  sunset: Date
): NightSkyInfo | null {
  // گام ۱: اگر هنوز روز است
  if (now < sunset) {
    return null;
  }

  // گام ۲: ساعت فعلی
  const currentHour = hourly.find((h) => h.hour === now.getHours());
  if (!currentHour) {
    return null;
  }

  const cloudCover = currentHour.cloudCover;
  const visibility = currentHour.visibility;

  // گام ۳: فاز ماه
  const moonPhase = getMoonPhase(now);
  const moonIllumination = (1 - Math.cos(2 * Math.PI * moonPhase)) / 2 * 100;

  // گام ۵: مناسب برای ستاره‌بینی؟
  const isGoodForStargazing = cloudCover < 30 && (visibility ?? 0) > 10000;

  // گام ۶: پیام
  let message: string;
  if (isGoodForStargazing) {
    message = 'امشب آسمان صاف است — مناسب قدم زدن شبانه و ستاره‌بینی.';
  } else if (cloudCover > 70) {
    message = 'امشب ابری — ستاره‌بینی ممکن نیست.';
  } else {
    message = 'امشب کمی ابر — ستاره‌بینی محدود.';
  }

  return {
    cloudCover,
    visibility,
    moonPhase,
    moonIllumination,
    isGoodForStargazing,
    message,
  };
}

// ----- getMoonPhase -----
export function getMoonPhase(date: Date): number {
  // مرجع: ماه نو ۶ ژانویه ۲۰۰۰ ساعت ۱۸:۱۴ UTC
  const newMoonReference = new Date('2000-01-06T18:14:00Z');
  const daysSinceNewMoon = (date.getTime() - newMoonReference.getTime()) / 86400000;
  const phase = (daysSinceNewMoon % 29.53059) / 29.53059;
  return phase < 0 ? phase + 1 : phase;
}

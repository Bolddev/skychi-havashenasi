// ============================================================
// اسکای‌چی نسخه ۲.۰ — اطلاعات خورشید، گرگ‌ومیش و ساعت طلایی
// ============================================================

import type { DailyData, DaylightInfo } from '../types';

export function calculateDaylightInfo(
  daily: DailyData,
  now: Date
): DaylightInfo {
  const sunrise = daily.sunrise;
  const sunset = daily.sunset;

  // گرگ‌ومیش مدنی (تقریب ۳۰ دقیقه)
  const civilTwilightStart = new Date(sunrise.getTime() - 30 * 60 * 1000);
  const civilTwilightEnd = new Date(sunset.getTime() + 30 * 60 * 1000);

  // ساعت طلایی صبح
  const goldenHourMorning = {
    start: sunrise,
    end: new Date(sunrise.getTime() + 60 * 60 * 1000),
  };

  // ساعت طلایی عصر
  const goldenHourEvening = {
    start: new Date(sunset.getTime() - 60 * 60 * 1000),
    end: sunset,
  };

  // روز یا شب
  const isDay = now >= sunrise && now <= sunset;

  // زمان تا غروب یا طلوع
  let timeUntilSunset: number | undefined;
  let timeUntilSunrise: number | undefined;

  if (isDay) {
    timeUntilSunset = Math.round((sunset.getTime() - now.getTime()) / (60 * 1000));
  } else {
    // فردا طلوع
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowSunrise = new Date(tomorrow);
    tomorrowSunrise.setHours(sunrise.getHours(), sunrise.getMinutes(), 0, 0);
    timeUntilSunrise = Math.round((tomorrowSunrise.getTime() - now.getTime()) / (60 * 1000));
  }

  return {
    sunrise,
    sunset,
    civilTwilightStart,
    civilTwilightEnd,
    goldenHourMorning,
    goldenHourEvening,
    isDay,
    timeUntilSunset,
    timeUntilSunrise,
  };
}

// ============================================================
// اسکای‌چی نسخه ۲.۰ — تصمیم کارواش
// ============================================================

import type { UserProfile, WeatherData, CarWashDecision } from '../types';

export function calculateCarWash(
  weatherData: WeatherData,
  profile: UserProfile,
  now: Date
): CarWashDecision | null {
  // گام ۱: بررسی
  if (!profile.hasCar || profile.carWashImportance === 'low') {
    return null;
  }

  // گام ۲-۳: ۴۸ و ۷۲ ساعت آینده
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const next48h = weatherData.hourly.filter((h) => h.time <= in48h);
  const next72h = weatherData.hourly.filter((h) => h.time <= in72h);

  // گام ۴-۵: حداکثر بارش
  const maxRain48 = next48h.length > 0
    ? Math.max(...next48h.map((h) => h.precipitationProbability))
    : 0;
  const maxRain72 = next72h.length > 0
    ? Math.max(...next72h.map((h) => h.precipitationProbability))
    : 0;

  // گام ۶: ساعت بعدی بارش
  const nextRainHour = weatherData.hourly.find(
    (h) => h.precipitationProbability >= 40 && h.time > now
  );

  // گام ۷: ساعت تا بارش
  const hoursUntilRain = nextRainHour
    ? Math.round((nextRainHour.time.getTime() - now.getTime()) / (60 * 60 * 1000))
    : null;

  // گام ۸: تصمیم
  let recommendation: 'wash' | 'dont-wash' | 'covered-parking';
  let reason: string;

  if (maxRain48 > 40) {
    recommendation = 'dont-wash';
    reason = `بارش در ۴۸ ساعت آینده (${Math.round(maxRain48)}٪).`;
  } else if (maxRain72 <= 30 && (hoursUntilRain === null || hoursUntilRain >= 72)) {
    recommendation = 'wash';
    reason = 'تا ۷۲ ساعت آینده بارش نیست.';
  } else {
    recommendation = 'dont-wash';
    reason = `بارش در ۷۲ ساعت آینده (${Math.round(maxRain72)}٪).`;
  }

  // گام ۹: توصیه پارکینگ
  let parkingAdvice: string | undefined;
  if (profile.parking === 'street' && hoursUntilRain !== null && hoursUntilRain < 24) {
    parkingAdvice = 'زیر سقف پارک کن';
  }

  return {
    recommendation,
    nextRainDate: nextRainHour?.time ?? null,
    hoursUntilRain,
    parkingAdvice,
    reason,
  };
}

// ============================================================
// اسکای‌چی نسخه ۲.۰ — توابع کمکی خورشید
// ============================================================

// گرگ‌ومیش مدنی (تقریب ۳۰ دقیقه برای عرض جغرافیایی ایران)
export function getCivilTwilight(sunrise: Date, sunset: Date): { start: Date; end: Date } {
  const civilTwilightStart = new Date(sunrise.getTime() - 30 * 60 * 1000);
  const civilTwilightEnd = new Date(sunset.getTime() + 30 * 60 * 1000);
  return { start: civilTwilightStart, end: civilTwilightEnd };
}

// ساعت طلایی صبح
export function getGoldenHourMorning(sunrise: Date): { start: Date; end: Date } {
  return {
    start: sunrise,
    end: new Date(sunrise.getTime() + 60 * 60 * 1000),
  };
}

// ساعت طلایی عصر
export function getGoldenHourEvening(sunset: Date): { start: Date; end: Date } {
  return {
    start: new Date(sunset.getTime() - 60 * 60 * 1000),
    end: sunset,
  };
}

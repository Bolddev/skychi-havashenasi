// ============================================================
// اسکای‌چی نسخه ۲.۰ — توابع کمکی
// ============================================================

// ----- toPersianDigits -----
export function toPersianDigits(input: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
}

// ----- formatTime -----
export function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return toPersianDigits(`${h}:${m}`);
}

// ----- formatTemp -----
export function formatTemp(temp: number): string {
  return toPersianDigits(`${Math.round(temp)}°C`);
}

// ----- formatWind -----
export function formatWind(speed: number): string {
  return toPersianDigits(`${Math.round(speed)} km/h`);
}

// ----- formatRain -----
export function formatRain(mm: number): string {
  return toPersianDigits(`${mm.toFixed(1)}mm`);
}

// ----- formatPercent -----
export function formatPercent(percent: number): string {
  return toPersianDigits(`${Math.round(percent)}٪`);
}

// ----- formatDuration -----
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return toPersianDigits(`${mins} دقیقه`);
  }
  if (mins === 0) {
    return toPersianDigits(`${hours} ساعت`);
  }
  return toPersianDigits(`${hours} ساعت و ${mins} دقیقه`);
}

// ----- formatDistance -----
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return toPersianDigits(`${Math.round(meters)} متر`);
  }
  return toPersianDigits(`${(meters / 1000).toFixed(1)} کیلومتر`);
}

// ----- getDayLabel -----
export function getDayLabel(date: Date, now: Date): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000);

  const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
  const dayName = dayNames[date.getDay()];

  if (diff === 0) return `امروز (${dayName})`;
  if (diff === 1) return `فردا (${dayName})`;
  if (diff === 2) return `پس‌فردا (${dayName})`;
  return dayName;
}

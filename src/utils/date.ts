// ============================================================
// اسکای‌چی نسخه ۲.۰ — توابع کمکی تاریخ
// ============================================================

import { toPersianDigits } from './format';

// نام ماه‌های شمسی
const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

// نام روزهای هفته
const WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

// تبدیل میلادی به شمسی
export function toJalali(date: Date): { year: number; month: number; day: number } {
  const gY = date.getFullYear();
  const gM = date.getMonth() + 1;
  const gD = date.getDate();

  const gDaysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gM > 2 ? gY + 1 : gY;
  let days = 355666 + 365 * gY + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gD + gDaysInMonth[gM - 1];
  let jY = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jY += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jY += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jM, jD;
  if (days < 186) {
    jM = 1 + Math.floor(days / 31);
    jD = 1 + (days % 31);
  } else {
    jM = 7 + Math.floor((days - 186) / 30);
    jD = 1 + ((days - 186) % 30);
  }
  return { year: jY, month: jM, day: jD };
}

// فرمت کامل شمسی: «شنبه، ۲ آبان ۱۴۰۵»
export function formatJalali(date: Date): string {
  const jalali = toJalali(date);
  const weekday = WEEKDAYS[date.getDay()];
  const month = JALALI_MONTHS[jalali.month - 1];
  return toPersianDigits(`${weekday}، ${jalali.day} ${month} ${jalali.year}`);
}

// فرمت کوتاه شمسی: «۲ آبان»
export function formatJalaliShort(date: Date): string {
  const jalali = toJalali(date);
  const month = JALALI_MONTHS[jalali.month - 1];
  return toPersianDigits(`${jalali.day} ${month}`);
}

// برچسب روز: «امروز (شنبه، ۲ آبان)» / «فردا (یکشنبه، ۳ آبان)»
export function getDayLabelJalali(date: Date, now: Date): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  const weekday = WEEKDAYS[date.getDay()];
  const jalali = toJalali(date);
  const month = JALALI_MONTHS[jalali.month - 1];
  const dateStr = toPersianDigits(`${jalali.day} ${month}`);

  if (diff === 0) return `امروز (${weekday}، ${dateStr})`;
  if (diff === 1) return `فردا (${weekday}، ${dateStr})`;
  if (diff === 2) return `پس‌فردا (${weekday}، ${dateStr})`;
  return `${weekday} ${dateStr}`;
}

// ============================================================
// اسکای‌چی نسخه ۲.۰ — نگاشت کدهای WMO
// ============================================================

export interface WmoLabel {
  code: number;
  label: string;
  icon: string;
  severity: 'none' | 'very-light' | 'light' | 'moderate' | 'heavy' | 'severe';
}

export const WMO_LABELS: Record<number, WmoLabel> = {
  0: { code: 0, label: 'آسمان صاف', icon: '☀️', severity: 'none' },
  1: { code: 1, label: 'عمدتاً صاف', icon: '🌤️', severity: 'none' },
  2: { code: 2, label: 'نیمه‌ابری', icon: '⛅', severity: 'none' },
  3: { code: 3, label: 'ابری', icon: '☁️', severity: 'none' },
  45: { code: 45, label: 'مه', icon: '🌫️', severity: 'none' },
  48: { code: 48, label: 'مه یخ‌زده', icon: '🌫️', severity: 'light' },
  51: { code: 51, label: 'نم‌نم باران سبک', icon: '🌦️', severity: 'very-light' },
  53: { code: 53, label: 'نم‌نم باران متوسط', icon: '🌦️', severity: 'light' },
  55: { code: 55, label: 'نم‌نم باران شدید', icon: '🌧️', severity: 'moderate' },
  56: { code: 56, label: 'نم‌نم باران یخ‌زده سبک', icon: '🌧️', severity: 'light' },
  57: { code: 57, label: 'نم‌نم باران یخ‌زده شدید', icon: '🌧️', severity: 'moderate' },
  61: { code: 61, label: 'باران سبک', icon: '🌧️', severity: 'light' },
  63: { code: 63, label: 'باران متوسط', icon: '🌧️', severity: 'moderate' },
  65: { code: 65, label: 'باران شدید', icon: '🌧️', severity: 'heavy' },
  66: { code: 66, label: 'باران یخ‌زده سبک', icon: '🌧️', severity: 'light' },
  67: { code: 67, label: 'باران یخ‌زده شدید', icon: '🌧️', severity: 'heavy' },
  71: { code: 71, label: 'برف سبک', icon: '🌨️', severity: 'light' },
  73: { code: 73, label: 'برف متوسط', icon: '🌨️', severity: 'moderate' },
  75: { code: 75, label: 'برف شدید', icon: '❄️', severity: 'heavy' },
  77: { code: 77, label: 'دانه‌های برف', icon: '🌨️', severity: 'light' },
  80: { code: 80, label: 'رگبار سبک', icon: '🌦️', severity: 'light' },
  81: { code: 81, label: 'رگبار متوسط', icon: '🌧️', severity: 'moderate' },
  82: { code: 82, label: 'رگبار شدید', icon: '⛈️', severity: 'heavy' },
  85: { code: 85, label: 'رگبار برف سبک', icon: '🌨️', severity: 'light' },
  86: { code: 86, label: 'رگبار برف شدید', icon: '❄️', severity: 'heavy' },
  95: { code: 95, label: 'رعدوبرق', icon: '⛈️', severity: 'severe' },
  96: { code: 96, label: 'رعدوبرق با تگرگ سبک', icon: '⛈️', severity: 'severe' },
  99: { code: 99, label: 'رعدوبرق با تگرگ شدید', icon: '⛈️', severity: 'severe' },
};

export function getWmoLabel(code: number): WmoLabel {
  return WMO_LABELS[code] || { code, label: 'نامشخص', icon: '❓', severity: 'none' };
}

export function isRainCode(code: number): boolean {
  return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
}

export function isSnowCode(code: number): boolean {
  return [71, 73, 75, 77, 85, 86].includes(code);
}

export function isThunderCode(code: number): boolean {
  return [95, 96, 99].includes(code);
}

export function isFogCode(code: number): boolean {
  return [45, 48].includes(code);
}

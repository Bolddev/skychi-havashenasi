// ============================================================
// اسکای‌چی نسخه ۲.۰ — تشخیص تغییر پیش‌بینی
// ============================================================

import type { HourlyData, ForecastSnapshot, ForecastChange } from '../types';

export function detectForecastChange(
  currentHourly: HourlyData[],
  snapshot: ForecastSnapshot | null
): ForecastChange | null {
  if (!snapshot) {
    return null;
  }

  const changes: ForecastChange['changes'] = [];

  // بررسی ساعت‌های ۱۶-۲۲
  for (let hour = 16; hour <= 22; hour++) {
    const current = currentHourly.find((h) => h.hour === hour);
    const old = snapshot.hourly.find((h) => h.hour === hour);

    if (!current || !old) continue;

    const rainDiff = Math.abs(current.precipitationProbability - old.precipitationProbability);
    const tempDiff = Math.abs(current.apparentTemperature - old.apparentTemperature);

    if (rainDiff >= 30) {
      const direction = current.precipitationProbability > old.precipitationProbability ? 'افزایش' : 'کاهش';
      changes.push({
        type: 'rain',
        hour,
        from: old.precipitationProbability,
        to: current.precipitationProbability,
        message: `بارش ${hour}:00 از ${Math.round(old.precipitationProbability)}٪ به ${Math.round(current.precipitationProbability)}٪ ${direction} یافت.`,
      });
    }

    if (tempDiff >= 3) {
      const direction = current.apparentTemperature > old.apparentTemperature ? 'افزایش' : 'کاهش';
      changes.push({
        type: 'temperature',
        hour,
        from: old.apparentTemperature,
        to: current.apparentTemperature,
        message: `دمای ${hour}:00 از ${Math.round(old.apparentTemperature)}°C به ${Math.round(current.apparentTemperature)}°C ${direction} یافت.`,
      });
    }
  }

  if (changes.length === 0) {
    return null;
  }

  return { changes };
}

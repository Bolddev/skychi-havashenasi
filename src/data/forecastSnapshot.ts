// ============================================================
// اسکای‌چی نسخه ۲.۰ — ذخیره پیش‌بینی صبح
// ============================================================

import type { ForecastSnapshot, HourlyData } from '../types';

const SNAPSHOT_KEY = 'skychi:forecastSnapshot';
const SNAPSHOT_TTL_HOURS = 6;

export function getForecastSnapshot(): ForecastSnapshot | null {
  try {
    const stored = localStorage.getItem(SNAPSHOT_KEY);
    if (!stored) return null;

    const snapshot: ForecastSnapshot = JSON.parse(stored);
    const now = Date.now();
    const age = (now - new Date(snapshot.capturedAt).getTime()) / (60 * 60 * 1000);

    if (age > SNAPSHOT_TTL_HOURS) {
      localStorage.removeItem(SNAPSHOT_KEY);
      return null;
    }

    // تبدیل تاریخ
    snapshot.capturedAt = new Date(snapshot.capturedAt);
    return snapshot;
  } catch (e) {
    console.error('Snapshot read error:', e);
    return null;
  }
}

export function saveForecastSnapshot(hourly: HourlyData[]): void {
  try {
    const now = new Date();
    const snapshot: ForecastSnapshot = {
      capturedAt: now,
      hourly: hourly
        .filter((h) => h.hour >= 16 && h.hour <= 22)
        .map((h) => ({
          hour: h.hour,
          apparentTemperature: h.apparentTemperature,
          precipitationProbability: h.precipitationProbability,
        })),
    };

    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.error('Snapshot write error:', e);
  }
}

export function shouldSaveNewSnapshot(): boolean {
  const snapshot = getForecastSnapshot();
  if (!snapshot) return true;

  const now = Date.now();
  const age = (now - new Date(snapshot.capturedAt).getTime()) / (60 * 60 * 1000);
  return age >= SNAPSHOT_TTL_HOURS;
}

export function clearSnapshot(): void {
  localStorage.removeItem(SNAPSHOT_KEY);
}

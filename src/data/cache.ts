// ============================================================
// اسکای‌چی نسخه ۲.۰ — کش با TTL
// ============================================================

import type { WeatherData } from '../types';

const CACHE_KEY = 'skychi:weatherCache';
const TTL_MINUTES = 15;

interface CacheEntry {
  data: WeatherData;
  cachedAt: number;
}

export function getCachedWeather(): WeatherData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    const age = (now - entry.cachedAt) / (60 * 1000);

    if (age > TTL_MINUTES) {
      // کش منقضی شده
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // تبدیل رشته‌های تاریخ به Date
    const data = deserializeWeatherData(entry.data);
    return data;
  } catch (e) {
    console.error('Cache read error:', e);
    return null;
  }
}

export function setCachedWeather(data: WeatherData): void {
  try {
    const entry: CacheEntry = {
      data,
      cachedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

// تبدیل Date ها از JSON
function deserializeWeatherData(data: WeatherData): WeatherData {
  return {
    ...data,
    fetchedAt: new Date(data.fetchedAt),
    hourly: data.hourly.map((h) => ({
      ...h,
      time: new Date(h.time),
    })),
    daily: data.daily.map((d) => ({
      ...d,
      date: new Date(d.date),
      sunrise: new Date(d.sunrise),
      sunset: new Date(d.sunset),
    })),
    minutely15: data.minutely15?.map((m) => ({
      ...m,
      time: new Date(m.time),
    })),
    airQuality: data.airQuality?.map((a) => ({
      ...a,
      time: new Date(a.time),
    })),
    yesterday: data.yesterday?.map((h) => ({
      ...h,
      time: new Date(h.time),
    })),
  };
}

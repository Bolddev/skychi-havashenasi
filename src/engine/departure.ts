// ============================================================
// اسکای‌چی نسخه ۲.۰ — زمان حرکت و مدت پیشنهادی
// ============================================================

import type { UserProfile, TimeWindow } from '../types';

export function calculateDepartureSuggestion(
  goldenWindow: TimeWindow | null,
  profile: UserProfile,
  now: Date
): { time: Date; message: string } | null {
  if (!goldenWindow) {
    return null;
  }

  const walkingTime = profile.walkingTimeMinutes ?? 15;
  const departure = new Date(goldenWindow.start.getTime() - (walkingTime + 5) * 60 * 1000);

  let message: string;

  if (departure < now) {
    // همین الان
    const nowPlus5 = new Date(now.getTime() + 5 * 60 * 1000);
    message = `⏰ حرکت کن: همین الان (یا حداکثر ${formatTime(nowPlus5)}) تا به پنجره طلایی برسی.`;
    return { time: now, message };
  }

  const hoursUntil = (departure.getTime() - now.getTime()) / (60 * 60 * 1000);

  if (hoursUntil > 2) {
    message = `بعداً حرکت کن: ${formatTime(departure)} (${Math.round(hoursUntil)} ساعت دیگر).`;
  } else {
    message = `⏰ حرکت کن: ${formatTime(departure)} تا به پنجره طلایی برسی.`;
  }

  return { time: departure, message };
}

export function calculateDurationSuggestion(
  goldenWindow: TimeWindow | null,
  typicalOutingDuration: number
): string | null {
  if (!goldenWindow) {
    return null;
  }

  const typical = typicalOutingDuration;
  const start = goldenWindow.start;
  const end = new Date(start.getTime() + typical * 60 * 60 * 1000);

  const actualEnd = end > goldenWindow.end ? goldenWindow.end : end;

  return `⏱️ بر اساس مدت معمول تو (${typical} ساعت): شروع پیشنهادی ${formatTime(start)}، برگشت ${formatTime(actualEnd)}.`;
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ============================================================
// اسکای‌چی نسخه ۲.۰ — مقایسه پروفایل‌ها
// ============================================================

import type { UserProfile, WeatherData, FriendComparison, TimeWindow } from '../types';
import { findGoldenWindow } from './goldenWindow';
import { calculateAllHourRisks } from './risk';

export function compareProfiles(
  profiles: UserProfile[],
  weatherData: WeatherData,
  activeProfileId: string
): FriendComparison | null {
  if (profiles.length < 2) {
    return null;
  }

  const windows: { profileId: string; name: string; window: TimeWindow | null }[] = [];

  for (const profile of profiles) {
    const hourlyRisk = calculateAllHourRisks(
      weatherData.hourly,
      weatherData.yesterday,
      weatherData.airQuality,
      profile,
      16,
      22
    );

    const todayDaily = weatherData.daily[0];
    const { window } = todayDaily
      ? findGoldenWindow(hourlyRisk, todayDaily, profile)
      : { window: null };

    windows.push({
      profileId: profile.id,
      name: profile.name,
      window,
    });
  }

  const activeProfile = windows.find((w) => w.profileId === activeProfileId);
  const friendProfiles = windows.filter((w) => w.profileId !== activeProfileId);

  if (!activeProfile) {
    return null;
  }

  // محاسبه همپوشانی
  let overlapWindow: TimeWindow | null = null;
  let message: string;

  const allWindows = windows.map((w) => w.window).filter((w): w is TimeWindow => w !== null);

  if (allWindows.length === 0) {
    message = 'هیچ‌کدام پنجره امنی ندارند.';
  } else if (allWindows.length === 1) {
    const onlyWindow = allWindows[0];
    const owner = windows.find((w) => w.window === onlyWindow);
    message = `فقط ${owner?.name || 'نامشخص'} پنجره امن دارد.`;
  } else {
    // محاسبه اشتراک
    const overlapStart = new Date(Math.max(...allWindows.map((w) => w.start.getTime())));
    const overlapEnd = new Date(Math.min(...allWindows.map((w) => w.end.getTime())));

    if (overlapStart < overlapEnd) {
      const durationMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / (60 * 1000);
      overlapWindow = {
        start: overlapStart,
        end: overlapEnd,
        durationMinutes,
        averageRisk: 0,
      };
      message = `🤝 سازش: ${formatTime(overlapStart)} تا ${formatTime(overlapEnd)}`;
    } else {
      message = '⚠️ پنجره‌های امن همپوشانی ندارند.';
    }
  }

  return {
    activeProfileWindow: activeProfile.window,
    friendProfilesWindows: friendProfiles,
    overlapWindow,
    message,
  };
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

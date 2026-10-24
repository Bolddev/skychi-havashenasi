// ============================================================
// اسکای‌چی نسخه ۲.۰ — Nowcast نهایی
// ============================================================

import type { MinutelyData, NowcastState } from '../types';

export function computeNowcast(
  minutely15: MinutelyData[] | null | undefined,
  now: Date
): NowcastState {
  // گام ۱: بررسی داده
  if (!minutely15 || minutely15.length < 8) {
    return {
      status: 'no-data',
      message: 'داده لحظه‌ای در دسترس نیست.',
    };
  }

  // گام ۲: فیلتر ۲ ساعت آینده
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const next2h = minutely15.filter(
    (m) => m.time >= now && m.time <= twoHoursLater
  );

  if (next2h.length === 0) {
    return {
      status: 'no-data',
      message: 'داده لحظه‌ای در دسترس نیست.',
    };
  }

  // گام ۴: الان بارش دارد؟
  if (next2h[0].precipitation > 0.05) {
    const firstDryIndex = next2h.findIndex((m) => m.precipitation <= 0.05);

    if (firstDryIndex === -1) {
      // بارش تا آخر ادامه دارد
      return {
        status: 'raining-now',
        message: 'الان باران می‌بارد و تا ۲ ساعت آینده ادامه دارد.',
        continuesPast2h: true,
      };
    } else {
      const endsAt = next2h[firstDryIndex].time;
      const minutes = Math.round((endsAt.getTime() - now.getTime()) / 60000);

      // قاعده سخت: هیچ عددی > ۱۲۰
      if (minutes > 120) {
        console.error('Nowcast: minutes > 120 detected, returning no-data');
        return {
          status: 'no-data',
          message: 'داده لحظه‌ای نامعتبر است.',
        };
      }

      return {
        status: 'raining-now',
        message: `الان باران می‌بارد؛ حدود ${minutes} دقیقه دیگر قطع می‌شود.`,
        endsAt,
        continuesPast2h: false,
      };
    }
  }

  // گام ۵: الان خشک است
  const firstWetIndex = next2h.findIndex((m) => m.precipitation > 0.05);

  if (firstWetIndex === -1) {
    // تا ۲ ساعت خشک
    return {
      status: 'dry-next-2h',
      message: 'تا ۲ ساعت آینده باران پیش‌بینی نمی‌شود.',
    };
  }

  // بارش شروع می‌شود
  const startsAt = next2h[firstWetIndex].time;
  const minutesUntilRain = Math.round((startsAt.getTime() - now.getTime()) / 60000);

  // قاعده سخت
  if (minutesUntilRain > 120) {
    console.error('Nowcast: minutesUntilRain > 120 detected, returning no-data');
    return {
      status: 'no-data',
      message: 'داده لحظه‌ای نامعتبر است.',
    };
  }

  // مدت بارش
  let durationMinutes: number | undefined;
  for (let j = firstWetIndex + 1; j < next2h.length; j++) {
    if (next2h[j].precipitation <= 0.05) {
      const dur = Math.round((next2h[j].time.getTime() - startsAt.getTime()) / 60000);
      if (dur <= 120) {
        durationMinutes = dur;
      }
      break;
    }
  }

  let message = `باران در ${minutesUntilRain} دقیقه آینده شروع می‌شود`;
  if (durationMinutes) {
    message += `، حدود ${durationMinutes} دقیقه طول می‌کشد.`;
  } else {
    message += '.';
  }

  return {
    status: 'rain-starting-soon',
    message,
    startsAt,
    durationMinutes,
    minutesUntilRain,
  };
}

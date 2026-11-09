// ============================================================
// اسکای‌چی نسخه ۲.۰ — سیستم هشدارها
// ============================================================

import type { WeatherData, Alert } from '../types';

export function generateAlerts(
  weatherData: WeatherData,
  now: Date
): Alert[] {
  const alerts: Alert[] = [];

  // ساعت‌های ۱۶-۲۲
  const afternoonHours = weatherData.hourly.filter(
    (h) => h.hour >= 16 && h.hour <= 22
  );

  if (afternoonHours.length === 0) return alerts;

  const maxGust = Math.max(...afternoonHours.map((h) => h.windGusts));
  const minVisibility = Math.min(
    ...afternoonHours.map((h) => h.visibility ?? 10000)
  );
  const minAT = Math.min(...afternoonHours.map((h) => h.apparentTemperature));
  const hasPrecipitation = afternoonHours.some((h) => h.precipitation > 0);
  const maxAQI = weatherData.airQuality?.[0]?.europeanAqi ?? 0;
  const maxUV = Math.max(...afternoonHours.map((h) => h.uvIndex));

  const validFrom = now;
  const validUntil = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  // تندباد
  if (maxGust >= 70) {
    alerts.push({
      type: 'wind',
      severity: 'danger',
      message: `باد خیلی شدید تا ${Math.round(maxGust)} km/h. در صورت امکان بیرون نرو.`,
      icon: '💨',
      validFrom,
      validUntil,
    });
  } else if (maxGust >= 50) {
    alerts.push({
      type: 'wind',
      severity: 'warning',
      message: `باد شدید تا ${Math.round(maxGust)} km/h. چتر نبر، وسایل سبک را محکم کن.`,
      icon: '💨',
      validFrom,
      validUntil,
    });
  }

  // مه
  if (minVisibility < 500) {
    alerts.push({
      type: 'fog',
      severity: 'danger',
      message: `مه غلیظ — دید ${Math.round(minVisibility)} متر. در صورت امکان رانندگی نکن.`,
      icon: '🌫️',
      validFrom,
      validUntil,
    });
  } else if (minVisibility < 1000) {
    alerts.push({
      type: 'fog',
      severity: 'warning',
      message: `مه — دید ${Math.round(minVisibility)} متر. رانندگی و پیاده‌روی با احتیاط.`,
      icon: '🌫️',
      validFrom,
      validUntil,
    });
  }

  // یخ‌زدگی
  if (minAT < 2 && hasPrecipitation) {
    alerts.push({
      type: 'ice',
      severity: 'warning',
      message: 'احتمال یخ‌زدگی سطح. مسیر ممکن است لغزنده باشد.',
      icon: '🧊',
      validFrom,
      validUntil,
    });
  }

  // آلودگی
  if (maxAQI > 120) {
    alerts.push({
      type: 'air',
      severity: 'danger',
      message: `آلودگی شدید — AQI ${Math.round(maxAQI)}. در خانه بمان.`,
      icon: '😷',
      validFrom,
      validUntil,
    });
  } else if (maxAQI > 80) {
    alerts.push({
      type: 'air',
      severity: 'warning',
      message: `کیفیت هوا ضعیف — AQI ${Math.round(maxAQI)}. پیاده‌روی طولانی نکن.`,
      icon: '😷',
      validFrom,
      validUntil,
    });
  }

  // UV بالا
  if (maxUV >= 8) {
    alerts.push({
      type: 'uv',
      severity: 'warning',
      message: `UV بالا — ${Math.round(maxUV)}. ضدآفتاب و کلاه لبه‌دار.`,
      icon: '☀️',
      validFrom,
      validUntil,
    });
  }

  return alerts;
}

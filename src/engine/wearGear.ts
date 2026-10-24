// ============================================================
// اسکای‌چی نسخه ۲.۰ — تولید پوشش و تجهیزات با دلیل
// ============================================================

import type { UserProfile, WeatherData, TimeWindow, AdviceWithReasons, GearAdvice, Gear } from '../types';

// ----- wearAdvice -----
export function generateWearAdvice(
  goldenWindow: TimeWindow | null,
  weatherData: WeatherData,
  profile: UserProfile
): AdviceWithReasons {
  // ساعت‌های هدف
  const targetHours = goldenWindow
    ? weatherData.hourly.filter((h) => {
        const t = h.time.getTime();
        return t >= goldenWindow.start.getTime() && t < goldenWindow.end.getTime();
      })
    : weatherData.hourly.filter((h) => h.hour >= 16 && h.hour <= 22);

  if (targetHours.length === 0) {
    return {
      items: [],
      summary: 'داده کافی برای توصیه پوشش در دسترس نیست.',
    };
  }

  // محاسبه دماها
  const temps = targetHours.map((h) => h.apparentTemperature);
  const minAT = Math.min(...temps);
  const maxAT = Math.max(...temps);
  const avgAT = temps.reduce((sum, t) => sum + t, 0) / temps.length;

  // لایه اصلی
  const items: { item: string; reason: string }[] = [];
  let mainLayer: string;

  if (minAT < 5) {
    mainLayer = 'کاپشن زمستانی + لایه میانی + شال گردن + دستکش';
  } else if (minAT < 10) {
    mainLayer = 'کاپشن زمستانی + لایه میانی';
  } else if (minAT < 16) {
    mainLayer = 'کاپشن سبک + لایه نازک';
  } else if (minAT < 22) {
    mainLayer = 'لباس آستین بلند یا سویشرت سبک';
  } else {
    mainLayer = 'لباس معمولی';
  }

  items.push({ item: mainLayer, reason: `دمای بازه: ${Math.round(minAT)}–${Math.round(maxAT)}°C` });

  // اگر اختلاف دما زیاد است
  if (maxAT - minAT > 8) {
    items.push({ item: 'لایه اضافه', reason: 'دما در بازه تغییر می‌کند' });
  }

  // شوک دمایی
  const shockHour = targetHours.find((h) => {
    const yesterdayH = weatherData.yesterday?.find((yh) => yh.hour === h.hour);
    if (!yesterdayH) return false;
    const diff = yesterdayH.apparentTemperature - h.apparentTemperature;
    return diff >= 5;
  });

  if (shockHour) {
    items.unshift({ item: 'لایه گرم اضافه', reason: 'امروز نسبت به دیروز محسوس سردتر است' });
  }

  // دلایل
  const reasons: string[] = [];
  reasons.push(`آستانه آسایش تو: ${profile.coldComfortThreshold}°C`);
  reasons.push(`دمای بازه: ${Math.round(minAT)}–${Math.round(maxAT)}°C`);
  reasons.push(`انتخاب: ${mainLayer}`);

  return {
    items,
    summary: items.map((i) => i.item).join('، '),
  };
}

// ----- gearAdvice -----
export function generateGearAdvice(
  goldenWindow: TimeWindow | null,
  weatherData: WeatherData,
  profile: UserProfile
): GearAdvice {
  // ساعت‌های هدف
  const targetHours = goldenWindow
    ? weatherData.hourly.filter((h) => {
        const t = h.time.getTime();
        return t >= goldenWindow.start.getTime() && t < goldenWindow.end.getTime();
      })
    : weatherData.hourly.filter((h) => h.hour >= 16 && h.hour <= 22);

  if (targetHours.length === 0) {
    return {
      items: [],
      summary: 'داده کافی برای توصیه تجهیزات در دسترس نیست.',
    };
  }

  // محاسبه حداکثرها
  const maxRain = Math.max(...targetHours.map((h) => h.precipitationProbability));
  const maxGust = Math.max(...targetHours.map((h) => h.windGusts));
  const maxUV = Math.max(...targetHours.map((h) => h.uvIndex));
  const minAT = Math.min(...targetHours.map((h) => h.apparentTemperature));

  const items: { gear: Gear; reason: string }[] = [];
  const conditional: string[] = [];

  // چتر
  if (maxRain >= 40 && profile.gear.includes('umbrella')) {
    if (maxGust >= 25 || profile.umbrellaBadInWind) {
      items.push({ gear: 'raincoat', reason: 'بارانی/کلاه ضدآب؛ چتر نبر (باد شدید)' });
    } else {
      items.push({ gear: 'umbrella', reason: 'چتر ببر' });
    }
  }

  // بارانی
  if (maxRain >= 40 && profile.gear.includes('raincoat')) {
    if (!items.some((i) => i.gear === 'raincoat')) {
      items.push({ gear: 'raincoat', reason: 'بارانی' });
    }
  }

  // کلاه (UV)
  if (maxUV > profile.uvThreshold && profile.gear.includes('hat')) {
    items.push({ gear: 'hat', reason: 'کلاه لبه‌دار' });
  }

  // کلاه (باد)
  if (maxGust >= 30 && profile.gear.includes('hat')) {
    if (!items.some((i) => i.gear === 'hat')) {
      items.push({ gear: 'hat', reason: 'کلاه محکم (بادگیر)' });
    }
  }

  // ضدآفتاب
  if (maxUV > profile.uvThreshold && profile.gear.includes('sunscreen')) {
    items.push({ gear: 'sunscreen', reason: 'ضدآفتاب' });
  }

  // دستکش
  if (minAT < 5 && profile.gear.includes('gloves')) {
    items.push({ gear: 'gloves', reason: 'دستکش' });
  }

  // اگر خالی بود
  if (items.length === 0) {
    items.push({ gear: 'jacket', reason: 'تجهیز خاصی لازم نیست' });
  }

  // شرطی
  if (goldenWindow) {
    const afterWindow = weatherData.hourly.find((h) => {
      return h.time.getTime() >= goldenWindow.end.getTime() && h.precipitationProbability >= 40;
    });
    if (afterWindow) {
      const time = afterWindow.time.getHours().toString().padStart(2, '0') + ':00';
      conditional.push(`اگر بعد از ${time} می‌روی: چتر بردار`);
    }
  }

  // دلایل
  const reasons: string[] = [];
  reasons.push(`بارش حداکثر ${Math.round(maxRain)}٪`);
  reasons.push(`باد حداکثر ${Math.round(maxGust)} km/h`);
  reasons.push(`UV ${Math.round(maxUV)}`);

  const summary = items.map((i) => i.reason).join('، ');

  return { items, summary };
}

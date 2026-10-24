// ============================================================
// اسکای‌چی نسخه ۲.۰ — موتور خطر با Breakdown
// ============================================================

import type { HourlyData, UserProfile, HourRisk, HourRiskBreakdown, BreakdownItem, AirQualityData } from '../types';

// ----- توابع کمکی -----
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// کدهای WMO باران
const RAIN_CODES = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99];
// کدهای WMO برف
const SNOW_CODES = [71, 73, 75, 77, 85, 86];

// توصیف ساده WMO (نسخه اولیه — در بخش ۲ کامل می‌شود)
function getWmoLabel(code: number): string {
  if (code === 0) return 'صاف';
  if (code <= 3) return 'نیمه‌ابری';
  if (code === 45 || code === 48) return 'مه';
  if (code === 51) return 'نم‌نم باران';
  if (code === 53) return 'باران ریز';
  if (code === 55) return 'نم‌نم باران شدید';
  if (code === 61) return 'باران خفیف';
  if (code === 63) return 'باران';
  if (code === 65) return 'باران شدید';
  if (code === 71) return 'برف خفیف';
  if (code === 73) return 'برف';
  if (code === 75) return 'برف شدید';
  if (code === 80) return 'رگبار خفیف';
  if (code === 81) return 'رگبار';
  if (code === 82) return 'رگبار شدید';
  if (code === 95) return 'رعد و برق';
  if (code === 96 || code === 99) return 'رعد و برق با تگرگ';
  return 'نامشخص';
}

// ----- rainRisk -----
export function rainRisk(hour: HourlyData, profile: UserProfile): BreakdownItem {
  const P = hour.precipitationProbability / 100;
  const I = hour.precipitation;
  const isRainy = RAIN_CODES.includes(hour.weatherCode);
  const isSnowy = SNOW_CODES.includes(hour.weatherCode);

  let baseRisk = 60 * P + 30 * Math.min(I / 2, 1);
  if (isRainy) baseRisk += 20;
  if (isSnowy) baseRisk += 30;

  // ضریب حمل‌ونقل
  if (profile.transport === 'walking') baseRisk *= 1.3;
  else if (profile.transport === 'car') baseRisk *= 0.7;

  const score = clamp(baseRisk, 0, 100);

  let detail: string;
  if (P < 0.05 && I < 0.1) {
    detail = 'بدون بارش';
  } else if (P < 0.2) {
    detail = `احتمال کم ${getWmoLabel(hour.weatherCode)} (${I}mm)`;
  } else {
    detail = `${getWmoLabel(hour.weatherCode)} — احتمال ${Math.round(P * 100)}٪ (${I}mm)`;
  }

  return { score, detail };
}

// ----- windRisk -----
export function windRisk(hour: HourlyData, profile: UserProfile): BreakdownItem {
  const G = hour.windGusts;
  const S = hour.windSpeed;
  const threshold = profile.windAnnoyThreshold;

  let score: number;
  if (G < threshold) {
    score = (G / threshold) * 20;
  } else if (G < threshold * 1.5) {
    score = 30 + ((G - threshold) / (threshold * 0.5)) * 30;
  } else if (G < threshold * 2) {
    score = 60 + ((G - threshold * 1.5) / (threshold * 0.5)) * 25;
  } else {
    score = 85 + Math.min((G - threshold * 2) / 20, 15);
  }

  // اگر بارش زیاد و باد شدید → چتر خطرناک
  if (hour.precipitationProbability > 40 && G > 25) {
    score += 15;
  }

  score = clamp(score, 0, 100);

  // تفسیر gust
  let gustLabel: string;
  if (G < threshold * 0.5) gustLabel = 'ملایم';
  else if (G < threshold) gustLabel = 'قابل تحمل';
  else if (G < threshold * 1.5) gustLabel = 'آزاردهنده';
  else if (G < threshold * 2) gustLabel = 'شدید';
  else gustLabel = 'خیلی شدید';

  const detail = `باد ${Math.round(S)} km/h (گست ${Math.round(G)})، ${gustLabel}`;

  return { score, detail };
}

// ----- coldRisk -----
export function coldRisk(hour: HourlyData, profile: UserProfile): BreakdownItem {
  const AT = hour.apparentTemperature;
  const T = profile.coldComfortThreshold;

  let score: number;
  if (AT >= T) {
    score = 0;
  } else if (AT >= T - 4) {
    score = 20 + ((T - AT) / 4) * 20;
  } else if (AT >= T - 10) {
    score = 40 + ((T - 4 - AT) / 6) * 30;
  } else {
    score = 70 + Math.min(((T - 10 - AT) / 5) * 10, 30);
  }

  // رطوبت بالا + باد = احساس سرمای بیشتر
  if (hour.relativeHumidity > 70 && hour.windSpeed > 15) {
    score += 10;
  }

  score = clamp(score, 0, 100);

  const detail = `دمای احساسی ${Math.round(AT)}°C (آستانه تو: ${T}°C)`;

  return { score, detail };
}

// ----- shockRisk -----
export function shockRisk(
  todayHour: HourlyData,
  yesterdayHour: HourlyData | null
): BreakdownItem {
  if (!yesterdayHour) {
    return { score: 0, detail: 'داده دیروز در دسترس نیست' };
  }

  const diff = yesterdayHour.apparentTemperature - todayHour.apparentTemperature;
  // مثبت = امروز سردتر از دیروز

  let score: number;
  if (diff >= 8) {
    score = 100;
  } else if (diff >= 5) {
    score = 60 + ((diff - 5) / 3) * 40;
  } else if (diff >= 3) {
    score = 20 + ((diff - 3) / 2) * 40;
  } else if (diff <= -8) {
    score = Math.max(0, 50); // شوک گرمایی
  } else {
    score = 0;
  }

  score = clamp(score, 0, 100);

  let detail: string;
  if (diff === 0) {
    detail = 'هم‌دمای دیروز';
  } else if (diff > 0) {
    detail = `${Math.round(diff)} درجه سردتر از دیروز`;
  } else {
    detail = `${Math.round(Math.abs(diff))} درجه گرم‌تر از دیروز`;
  }

  return { score, detail };
}

// ----- uvRisk -----
export function uvRisk(hour: HourlyData, profile: UserProfile): BreakdownItem {
  const UV = hour.uvIndex;
  const threshold = profile.uvThreshold;

  let score: number;
  if (UV <= threshold) {
    score = 0;
  } else {
    score = Math.min(((UV - threshold) / (11 - threshold)) * 80, 100);
  }

  score = clamp(score, 0, 100);

  // تفسیر UV
  let uvLabel: string;
  if (UV <= 2) uvLabel = 'کم';
  else if (UV <= 5) uvLabel = 'متوسط';
  else if (UV <= 7) uvLabel = 'بالا';
  else if (UV <= 10) uvLabel = 'خیلی بالا';
  else uvLabel = 'خطرناک';

  const detail = `UV ${Math.round(UV)} (${uvLabel})`;

  return { score, detail };
}

// ----- airRisk -----
export function airRisk(
  airData: AirQualityData | null | undefined,
  profile: UserProfile
): BreakdownItem {
  if (!airData || airData.europeanAqi == null) {
    return { score: 0, detail: 'داده کیفیت هوا در دسترس نیست' };
  }

  const AQI = airData.europeanAqi;
  let score: number;

  if (AQI <= 40) {
    score = 0;
  } else if (AQI <= 60) {
    score = 20;
  } else if (AQI <= 80) {
    score = 40;
  } else if (AQI <= 100) {
    score = 60;
  } else {
    score = 80 + Math.min(((AQI - 100) / 50) * 20, 20);
  }

  // ضریب حساسیت
  if (profile.respiratoryIssue || profile.seasonalAllergy) {
    score *= 1.3;
  }

  score = clamp(score, 0, 100);

  // تفسیر AQI
  let aqiLabel: string;
  if (AQI <= 20) aqiLabel = 'عالی';
  else if (AQI <= 40) aqiLabel = 'خوب';
  else if (AQI <= 60) aqiLabel = 'متوسط';
  else if (AQI <= 80) aqiLabel = 'ضعیف';
  else if (AQI <= 100) aqiLabel = 'خیلی ضعیف';
  else aqiLabel = 'خطرناک';

  const detail = `AQI ${Math.round(AQI)} (${aqiLabel})`;

  return { score, detail };
}

// ----- calculateHourRisk (تابع اصلی) -----
export function calculateHourRisk(
  hour: HourlyData,
  yesterdayHour: HourlyData | null,
  airData: AirQualityData | null | undefined,
  profile: UserProfile
): HourRisk {
  const weights = profile.weights;

  // محاسبه هر بخش
  const coldRaw = coldRisk(hour, profile);
  const windRaw = windRisk(hour, profile);
  const rainRaw = rainRisk(hour, profile);
  const shockRaw = shockRisk(hour, yesterdayHour);
  const uvRaw = uvRisk(hour, profile);
  const airRaw = airRisk(airData, profile);

  // ضرب در وزن‌ها
  const breakdown: HourRiskBreakdown = {
    cold: { score: coldRaw.score * weights.cold, detail: coldRaw.detail },
    wind: { score: windRaw.score * weights.wind, detail: windRaw.detail },
    rain: { score: rainRaw.score * weights.rain, detail: rainRaw.detail },
    shock: { score: shockRaw.score * weights.shock, detail: shockRaw.detail },
    uv: { score: uvRaw.score * weights.uv, detail: uvRaw.detail },
    air: { score: airRaw.score * weights.air, detail: airRaw.detail },
  };

  // جمع و clamp
  const totalRisk = clamp(
    breakdown.cold.score +
    breakdown.wind.score +
    breakdown.rain.score +
    breakdown.shock.score +
    breakdown.uv.score +
    breakdown.air.score,
    0,
    100
  );

  // برچسب
  let label: 'safe' | 'caution' | 'danger' | 'no-data';
  if (totalRisk < 30) label = 'safe';
  else if (totalRisk < 60) label = 'caution';
  else label = 'danger';

  // توصیه‌ها
  const advice: string[] = [];
  if (breakdown.cold.score > 15 && hour.apparentTemperature < profile.coldComfortThreshold) {
    advice.push('کاپشن بردار');
  }
  if (breakdown.rain.score > 15 && hour.precipitationProbability >= 40) {
    // در باد شدید (>= 25 km/h) چتر کار نمی‌کند - همیشه بارانی/کلاه ضدآب توصیه شود
    if (hour.windGusts >= 25) {
      advice.push('بارانی/کلاه ضدآب؛ چتر نبر (باد شدید)');
    } else if (profile.gear.includes('umbrella')) {
      advice.push('چتر ببر');
    }
  }
  if (breakdown.wind.score > 15) {
    advice.push('باد شدید — کلاه محکم');
  }
  if (breakdown.uv.score > 15) {
    advice.push('ضدآفتاب / کلاه لبه‌دار');
  }
  if (breakdown.air.score > 15) {
    advice.push('پیاده‌روی طولانی نکن');
  }

  return {
    hour: hour.hour,
    time: hour.time,
    risk: totalRisk,
    label,
    breakdown,
    rawData: hour,
    advice,
  };
}

// ----- calculateAllHourRisks (برای بازه ۱۶-۲۲) -----
export function calculateAllHourRisks(
  hourlyData: HourlyData[],
  yesterdayData: HourlyData[] | null | undefined,
  airData: AirQualityData[] | null | undefined,
  profile: UserProfile,
  startHour: number = 16,
  endHour: number = 22
): HourRisk[] {
  const risks: HourRisk[] = [];

  for (const hour of hourlyData) {
    if (hour.hour < startHour || hour.hour > endHour) continue;

    // پیدا کردن ساعت متناظر دیروز
    let yesterdayHour: HourlyData | null = null;
    if (yesterdayData) {
      yesterdayHour = yesterdayData.find((h) => h.hour === hour.hour) || null;
    }

    // پیدا کردن داده کیفیت هوا (ساعت متناظر)
    let hourAirData: AirQualityData | null | undefined = null;
    if (airData && airData.length > 0) {
      hourAirData = airData[0]; // فعلاً از اولین آیتم استفاده می‌کنیم
    }

    const risk = calculateHourRisk(hour, yesterdayHour, hourAirData, profile);
    risks.push(risk);
  }

  return risks;
}

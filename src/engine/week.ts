// ============================================================
// اسکای‌چی نسخه ۲.۰ — صفحه هفته: رتبه‌بندی، روند و الگو
// ============================================================

import type { UserProfile, WeatherData, DayRanking, WeekForecast, WeekDayForecast } from '../types';

export function calculateWeekRanking(
  weatherData: WeatherData,
  profile: UserProfile
): DayRanking[] {
  const rankings: DayRanking[] = [];

  for (const day of weatherData.daily) {
    const ranking = evaluateDay(day, weatherData, profile);
    rankings.push(ranking);
  }

  // مرتب‌سازی صعودی بر اساس امتیاز (کمتر = بهتر)
  rankings.sort((a, b) => a.score - b.score);

  return rankings;
}

function evaluateDay(
  day: import('../types').DailyData,
  weatherData: WeatherData,
  profile: UserProfile
): DayRanking {
  const avgAT = (day.apparentTempMax + day.apparentTempMin) / 2;
  const maxRain = day.precipitationProbabilityMax;
  const maxGust = day.windGustsMax;
  const maxUV = day.uvIndexMax;

  // امتیاز بر اساس معیارها
  let score = 0;

  // دما
  if (avgAT >= profile.coldComfortThreshold && avgAT <= profile.heatThreshold) {
    score += 0; // مطلوب
  } else if (avgAT < profile.coldComfortThreshold - 5 || avgAT > profile.heatThreshold + 5) {
    score += 40; // خیلی بد
  } else {
    score += 20; // متوسط
  }

  // بارش
  if (maxRain < 20) {
    score += 0;
  } else if (maxRain < 50) {
    score += 25;
  } else {
    score += 50;
  }

  // باد
  if (maxGust < profile.windAnnoyThreshold) {
    score += 0;
  } else if (maxGust < profile.windAnnoyThreshold * 1.5) {
    score += 20;
  } else {
    score += 40;
  }

  // UV
  if (maxUV <= profile.uvThreshold) {
    score += 0;
  } else if (maxUV <= profile.uvThreshold + 2) {
    score += 10;
  } else {
    score += 25;
  }

  // وضعیت
  let status: 'good' | 'caution' | 'bad';
  if (score < 33) {
    status = 'good';
  } else if (score < 66) {
    status = 'caution';
  } else {
    status = 'bad';
  }

  // دلایل
  const reasons: string[] = [];
  reasons.push(
    `دما ${Math.round(day.apparentTempMin)}–${Math.round(day.apparentTempMax)}°C، بارش ${Math.round(maxRain)}٪، باد ${Math.round(maxGust)} km/h`
  );

  // عامل محدودکننده
  let limitingFactor: string | null = null;
  if (status !== 'good') {
    if (maxRain >= 50) {
      limitingFactor = `بارش ${Math.round(maxRain)}٪`;
    } else if (maxGust >= profile.windAnnoyThreshold * 1.5) {
      limitingFactor = `باد ${Math.round(maxGust)} km/h`;
    } else if (avgAT < profile.coldComfortThreshold - 5) {
      limitingFactor = `سرد (${Math.round(avgAT)}°C)`;
    } else if (avgAT > profile.heatThreshold + 5) {
      limitingFactor = `گرم (${Math.round(avgAT)}°C)`;
    }
  }

  return {
    date: day.date,
    status,
    score,
    reasons,
    limitingFactor,
    label: day.label,
  };
}

export function calculateWeeklyTrend(weatherData: WeatherData): string {
  if (weatherData.daily.length < 7) {
    return 'داده کافی برای تحلیل روند هفتگی نیست.';
  }

  // میانگین دمای این هفته
  const thisWeekTemps = weatherData.daily.map((d) => d.apparentTempMax);
  const avgThisWeek = thisWeekTemps.reduce((sum, t) => sum + t, 0) / thisWeekTemps.length;

  // سردترین و گرم‌ترین روز
  const coldestDay = weatherData.daily.reduce((min, d) =>
    d.apparentTempMin < min.apparentTempMin ? d : min
  );
  const warmestDay = weatherData.daily.reduce((max, d) =>
    d.apparentTempMax > max.apparentTempMax ? d : max
  );

  let trend = `میانگین دمای این هفته: ${Math.round(avgThisWeek)}°C. `;
  trend += `سردترین روز: ${coldestDay.label || 'نامشخص'} (${Math.round(coldestDay.apparentTempMin)}°C). `;
  trend += `گرم‌ترین روز: ${warmestDay.label || 'نامشخص'} (${Math.round(warmestDay.apparentTempMax)}°C).`;

  return trend;
}

export function calculateWeekPattern(weatherData: WeatherData): string {
  const rainyDays = weatherData.daily.filter((d) => d.precipitationProbabilityMax >= 40);
  const windyDays = weatherData.daily.filter((d) => d.windGustsMax >= 40);
  const uvDays = weatherData.daily.filter((d) => d.uvIndexMax >= 8);

  if (rainyDays.length === 0 && windyDays.length === 0 && uvDays.length === 0) {
    return 'هفته آرام — همه روزها مطلوب.';
  }

  let pattern = '';

  if (rainyDays.length > 0) {
    const labels = rainyDays.map((d) => d.label || 'نامشخص').join('، ');
    pattern += `${rainyDays.length} روز بارانی: ${labels}. `;
  }

  if (windyDays.length > 0) {
    const labels = windyDays.map((d) => d.label || 'نامشخص').join('، ');
    pattern += `${windyDays.length} روز باد شدید: ${labels}. `;
  }

  if (uvDays.length > 0) {
    const labels = uvDays.map((d) => d.label || 'نامشخص').join('، ');
    pattern += `${uvDays.length} روز UV بالا: ${labels}.`;
  }

  return pattern.trim();
}

export function buildWeekForecast(
  weatherData: WeatherData,
  profile: UserProfile
): WeekForecast {
  const days: WeekDayForecast[] = weatherData.daily.map((day) => {
    const ranking = evaluateDay(day, weatherData, profile);

    return {
      date: day.date,
      label: day.label || 'نامشخص',
      weatherCode: day.weatherCode,
      tempMin: day.tempMin,
      tempMax: day.tempMax,
      apparentTempMin: day.apparentTempMin,
      apparentTempMax: day.apparentTempMax,
      precipitationProbabilityMax: day.precipitationProbabilityMax,
      precipitationSum: day.precipitationSum,
      windSpeedMax: day.windSpeedMax,
      windGustsMax: day.windGustsMax,
      uvIndexMax: day.uvIndexMax,
      bestWindow: null, // فعلاً null
      status: ranking.status,
      reasons: ranking.reasons,
    };
  });

  return { days };
}

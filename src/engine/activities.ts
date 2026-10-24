// ============================================================
// اسکای‌چی نسخه ۲.۰ — امتیاز فعالیت‌ها با بهترین بازه
// ============================================================

import type { UserProfile, WeatherData, ActivityScore, Activity, TimeWindow } from '../types';

export function calculateActivityScores(
  weatherData: WeatherData,
  profile: UserProfile
): ActivityScore[] {
  const scores: ActivityScore[] = [];

  for (const activity of profile.activities) {
    const score = evaluateActivity(activity, weatherData, profile);
    scores.push(score);
  }

  return scores;
}

function evaluateActivity(
  activity: Activity,
  weatherData: WeatherData,
  profile: UserProfile
): ActivityScore {
  // ساعت‌های ۱۶-۲۲
  const afternoonHours = weatherData.hourly.filter(
    (h) => h.hour >= 16 && h.hour <= 22
  );

  switch (activity) {
    case 'picnic':
      return evaluatePicnic(afternoonHours, weatherData, profile);
    case 'park':
      return evaluatePark(afternoonHours, profile);
    case 'walking':
      return evaluateWalking(afternoonHours, profile);
    case 'shopping':
      return evaluateShopping(afternoonHours);
    case 'sports':
      return evaluateSports(afternoonHours, weatherData);
    case 'photography':
      return evaluatePhotography(afternoonHours, weatherData);
    default:
      return {
        activity,
        status: 'caution',
        bestWindow: null,
        reasons: ['فعالیت ناشناخته'],
        limitingFactors: [],
      };
  }
}

// ----- پیک‌نیک -----
function evaluatePicnic(
  hours: import('../types').HourlyData[],
  weatherData: WeatherData,
  profile: UserProfile
): ActivityScore {
  if (hours.length === 0) {
    return {
      activity: 'picnic',
      status: 'bad',
      bestWindow: null,
      reasons: ['داده کافی نیست'],
      limitingFactors: ['داده ساعتی موجود نیست'],
    };
  }

  const avgAT = hours.reduce((sum, h) => sum + h.apparentTemperature, 0) / hours.length;
  const maxRain = Math.max(...hours.map((h) => h.precipitationProbability));
  const maxGust = Math.max(...hours.map((h) => h.windGusts));
  const maxUV = Math.max(...hours.map((h) => h.uvIndex));

  // زمین خشک: مجموع بارش در ۳ ساعت گذشته
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const pastHours = weatherData.hourly.filter(
    (h) => h.time >= threeHoursAgo && h.time < now
  );
  const pastRain = pastHours.reduce((sum, h) => sum + h.precipitation, 0);

  const reasons: string[] = [];
  const limitingFactors: string[] = [];

  reasons.push(
    `دما ${Math.round(avgAT)}°C (مطلوب ۱۸–۲۸)، بارش ${Math.round(maxRain)}٪، باد ${Math.round(maxGust)} km/h، UV ${Math.round(maxUV)}`
  );

  // بررسی معیارها
  const tempOk = avgAT >= 18 && avgAT <= 28;
  const rainOk = maxRain < 20;
  const gustOk = maxGust < 25;
  const uvOk = maxUV < 7;
  const groundOk = pastRain < 0.5;

  if (!tempOk) limitingFactors.push(`دما ${Math.round(avgAT)}°C خارج از محدوده`);
  if (!rainOk) limitingFactors.push(`بارش ${Math.round(maxRain)}٪`);
  if (!gustOk) limitingFactors.push(`باد ${Math.round(maxGust)} km/h`);
  if (!uvOk) limitingFactors.push(`UV ${Math.round(maxUV)}`);
  if (!groundOk) limitingFactors.push('زمین خیس');

  // وضعیت
  let status: 'good' | 'caution' | 'bad';
  if (tempOk && rainOk && gustOk && uvOk && groundOk) {
    status = 'good';
  } else if (!tempOk || !rainOk) {
    status = 'bad';
  } else {
    status = 'caution';
  }

  // بهترین بازه
  const bestWindow = findBestWindow(hours, (h) => {
    return (
      h.apparentTemperature >= 18 &&
      h.apparentTemperature <= 28 &&
      h.precipitationProbability < 20 &&
      h.windGusts < 25 &&
      h.uvIndex < 7
    );
  });

  return {
    activity: 'picnic',
    status,
    bestWindow,
    reasons,
    limitingFactors,
  };
}

// ----- پارک -----
function evaluatePark(
  hours: import('../types').HourlyData[],
  profile: UserProfile
): ActivityScore {
  if (hours.length === 0) {
    return {
      activity: 'park',
      status: 'bad',
      bestWindow: null,
      reasons: ['داده کافی نیست'],
      limitingFactors: [],
    };
  }

  const avgAT = hours.reduce((sum, h) => sum + h.apparentTemperature, 0) / hours.length;
  const maxRain = Math.max(...hours.map((h) => h.precipitationProbability));
  const maxGust = Math.max(...hours.map((h) => h.windGusts));

  const minTemp = profile.transport === 'walking' ? 18 : 15;

  const reasons: string[] = [];
  const limitingFactors: string[] = [];

  reasons.push(
    `دما ${Math.round(avgAT)}°C، بارش ${Math.round(maxRain)}٪، باد ${Math.round(maxGust)} km/h`
  );

  const tempOk = avgAT >= minTemp && avgAT <= 30;
  const rainOk = maxRain < 30;
  const gustOk = maxGust < 25;

  if (!tempOk) limitingFactors.push(`دما ${Math.round(avgAT)}°C`);
  if (!rainOk) limitingFactors.push(`بارش ${Math.round(maxRain)}٪`);
  if (!gustOk) limitingFactors.push(`باد ${Math.round(maxGust)} km/h`);

  let status: 'good' | 'caution' | 'bad';
  if (tempOk && rainOk && gustOk) {
    status = 'good';
  } else if (!tempOk || !rainOk) {
    status = 'bad';
  } else {
    status = 'caution';
  }

  const bestWindow = findBestWindow(hours, (h) => {
    return (
      h.apparentTemperature >= minTemp &&
      h.apparentTemperature <= 30 &&
      h.precipitationProbability < 30 &&
      h.windGusts < 25
    );
  });

  return {
    activity: 'park',
    status,
    bestWindow,
    reasons,
    limitingFactors,
  };
}

// ----- پیاده‌روی -----
function evaluateWalking(
  hours: import('../types').HourlyData[],
  profile: UserProfile
): ActivityScore {
  if (hours.length === 0) {
    return {
      activity: 'walking',
      status: 'bad',
      bestWindow: null,
      reasons: ['داده کافی نیست'],
      limitingFactors: [],
    };
  }

  const avgAT = hours.reduce((sum, h) => sum + h.apparentTemperature, 0) / hours.length;
  const maxRain = Math.max(...hours.map((h) => h.precipitationProbability));
  const maxGust = Math.max(...hours.map((h) => h.windGusts));
  const minVisibility = Math.min(...hours.map((h) => h.visibility ?? 10000));

  const rainLimit = profile.transport === 'walking' ? 25 : 40;

  const reasons: string[] = [];
  const limitingFactors: string[] = [];

  reasons.push(
    `دما ${Math.round(avgAT)}°C، بارش ${Math.round(maxRain)}٪، باد ${Math.round(maxGust)} km/h`
  );

  const tempOk = avgAT >= 10 && avgAT <= 28;
  const rainOk = maxRain < rainLimit;
  const gustOk = maxGust < 30;
  const visOk = minVisibility >= 1000;

  if (!tempOk) limitingFactors.push(`دما ${Math.round(avgAT)}°C`);
  if (!rainOk) limitingFactors.push(`بارش ${Math.round(maxRain)}٪`);
  if (!gustOk) limitingFactors.push(`باد ${Math.round(maxGust)} km/h`);
  if (!visOk) limitingFactors.push(`دید ${Math.round(minVisibility)}m`);

  let status: 'good' | 'caution' | 'bad';
  if (tempOk && rainOk && gustOk && visOk) {
    status = 'good';
  } else if (!tempOk || !rainOk) {
    status = 'bad';
  } else {
    status = 'caution';
  }

  const bestWindow = findBestWindow(hours, (h) => {
    return (
      h.apparentTemperature >= 10 &&
      h.apparentTemperature <= 28 &&
      h.precipitationProbability < rainLimit &&
      h.windGusts < 30 &&
      (h.visibility ?? 10000) >= 1000
    );
  });

  return {
    activity: 'walking',
    status,
    bestWindow,
    reasons,
    limitingFactors,
  };
}

// ----- خرید -----
function evaluateShopping(hours: import('../types').HourlyData[]): ActivityScore {
  if (hours.length === 0) {
    return {
      activity: 'shopping',
      status: 'caution',
      bestWindow: null,
      reasons: ['داده کافی نیست'],
      limitingFactors: [],
    };
  }

  const maxGust = Math.max(...hours.map((h) => h.windGusts));
  const hasIceRisk = hours.some(
    (h) => h.apparentTemperature < 2 && h.precipitation > 0
  );
  const hasSnow = hours.some(
    (h) => h.weatherCode >= 71 && h.weatherCode <= 77
  );

  const reasons: string[] = [];
  const limitingFactors: string[] = [];

  reasons.push(`باد ${Math.round(maxGust)} km/h`);

  if (hasIceRisk) limitingFactors.push('احتمال یخ‌زدگی');
  if (hasSnow) limitingFactors.push('بارش برف');
  if (maxGust > 35) limitingFactors.push(`باد ${Math.round(maxGust)} km/h`);

  let status: 'good' | 'caution' | 'bad';
  if (!hasIceRisk && !hasSnow && maxGust <= 35) {
    status = 'good';
  } else {
    status = 'caution';
  }

  const bestWindow = findBestWindow(hours, (h) => {
    return (
      !(h.apparentTemperature < 2 && h.precipitation > 0) &&
      !(h.weatherCode >= 71 && h.weatherCode <= 77) &&
      h.windGusts <= 35
    );
  });

  return {
    activity: 'shopping',
    status,
    bestWindow,
    reasons,
    limitingFactors,
  };
}

// ----- ورزش -----
function evaluateSports(
  hours: import('../types').HourlyData[],
  weatherData: WeatherData
): ActivityScore {
  if (hours.length === 0) {
    return {
      activity: 'sports',
      status: 'bad',
      bestWindow: null,
      reasons: ['داده کافی نیست'],
      limitingFactors: [],
    };
  }

  const avgAT = hours.reduce((sum, h) => sum + h.apparentTemperature, 0) / hours.length;
  const maxRain = Math.max(...hours.map((h) => h.precipitationProbability));
  const maxGust = Math.max(...hours.map((h) => h.windGusts));
  const maxUV = Math.max(...hours.map((h) => h.uvIndex));
  const maxAQI = weatherData.airQuality?.[0]?.europeanAqi ?? 0;

  const reasons: string[] = [];
  const limitingFactors: string[] = [];

  reasons.push(
    `دما ${Math.round(avgAT)}°C، بارش ${Math.round(maxRain)}٪، باد ${Math.round(maxGust)} km/h، UV ${Math.round(maxUV)}`
  );

  const tempOk = avgAT >= 8 && avgAT <= 30;
  const rainOk = maxRain < 30;
  const gustOk = maxGust < 30;
  const uvOk = maxUV < 8;
  const aqiOk = maxAQI < 80;

  if (!tempOk) limitingFactors.push(`دما ${Math.round(avgAT)}°C`);
  if (!rainOk) limitingFactors.push(`بارش ${Math.round(maxRain)}٪`);
  if (!gustOk) limitingFactors.push(`باد ${Math.round(maxGust)} km/h`);
  if (!uvOk) limitingFactors.push(`UV ${Math.round(maxUV)}`);
  if (!aqiOk) limitingFactors.push(`AQI ${Math.round(maxAQI)}`);

  let status: 'good' | 'caution' | 'bad';
  if (tempOk && rainOk && gustOk && uvOk && aqiOk) {
    status = 'good';
  } else if (!tempOk || !rainOk) {
    status = 'bad';
  } else {
    status = 'caution';
  }

  const bestWindow = findBestWindow(hours, (h) => {
    return (
      h.apparentTemperature >= 8 &&
      h.apparentTemperature <= 30 &&
      h.precipitationProbability < 30 &&
      h.windGusts < 30 &&
      h.uvIndex < 8
    );
  });

  return {
    activity: 'sports',
    status,
    bestWindow,
    reasons,
    limitingFactors,
  };
}

// ----- عکاسی -----
function evaluatePhotography(
  hours: import('../types').HourlyData[],
  weatherData: WeatherData
): ActivityScore {
  if (hours.length === 0) {
    return {
      activity: 'photography',
      status: 'bad',
      bestWindow: null,
      reasons: ['داده کافی نیست'],
      limitingFactors: [],
    };
  }

  const maxGust = Math.max(...hours.map((h) => h.windGusts));
  const avgCloud = hours.reduce((sum, h) => sum + h.cloudCover, 0) / hours.length;

  // ساعت طلایی عصر
  const sunset = weatherData.daily[0]?.sunset;
  const hasGoldenHour = sunset
    ? hours.some((h) => {
        const hourTime = h.time.getTime();
        const goldenStart = sunset.getTime() - 60 * 60 * 1000;
        return hourTime >= goldenStart && hourTime <= sunset.getTime();
      })
    : false;

  const reasons: string[] = [];
  const limitingFactors: string[] = [];

  reasons.push(`باد ${Math.round(maxGust)} km/h، ابر ${Math.round(avgCloud)}٪`);

  if (!hasGoldenHour) {
    limitingFactors.push('ساعت طلایی عکاسی در بازه نیست');
  }
  if (maxGust > 30) {
    limitingFactors.push(`باد ${Math.round(maxGust)} km/h`);
  }

  let status: 'good' | 'caution' | 'bad';
  if (hasGoldenHour && maxGust <= 30 && avgCloud >= 30 && avgCloud <= 70) {
    status = 'good';
    reasons.push('ساعت طلایی عصر، ابر مناسب');
  } else if (!hasGoldenHour || maxGust > 30) {
    status = 'bad';
  } else {
    status = 'caution';
  }

  const bestWindow = findBestWindow(hours, (h) => {
    return h.windGusts <= 30 && h.cloudCover >= 30 && h.cloudCover <= 70;
  });

  return {
    activity: 'photography',
    status,
    bestWindow,
    reasons,
    limitingFactors,
  };
}

// ----- تابع کمکی: پیدا کردن بهترین بازه -----
function findBestWindow(
  hours: import('../types').HourlyData[],
  criteria: (h: import('../types').HourlyData) => boolean
): TimeWindow | null {
  // ساعت‌هایی که معیارها را پاس می‌کنند
  const passingHours = hours.filter(criteria);

  if (passingHours.length === 0) return null;

  // گروه‌بندی به بازه‌های پیوسته
  const windows: TimeWindow[] = [];
  let currentWindow: import('../types').HourlyData[] = [passingHours[0]];

  for (let i = 1; i < passingHours.length; i++) {
    const prev = passingHours[i - 1];
    const curr = passingHours[i];
    if (curr.hour - prev.hour === 1) {
      currentWindow.push(curr);
    } else {
      windows.push(createTimeWindow(currentWindow));
      currentWindow = [curr];
    }
  }
  windows.push(createTimeWindow(currentWindow));

  // طولانی‌ترین بازه
  const longest = windows.reduce(
    (max, w) => (w.durationMinutes > max.durationMinutes ? w : max),
    windows[0]
  );

  // حداقل ۶۰ دقیقه
  if (longest.durationMinutes < 60) return null;

  return longest;
}

function createTimeWindow(hours: import('../types').HourlyData[]): TimeWindow {
  const start = hours[0].time;
  const end = new Date(hours[hours.length - 1].time.getTime() + 60 * 60 * 1000);
  const durationMinutes = (end.getTime() - start.getTime()) / (60 * 1000);
  const avgRisk = 0; // فعلاً صفر

  return { start, end, durationMinutes, averageRisk: avgRisk };
}

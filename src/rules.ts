import { Profile, WeatherData } from './store';
import { getCurrentHourIndex, formatHour } from './weather';

export interface HourlyRisk {
  hour: string;
  riskScore: number;
  level: 'green' | 'yellow' | 'red';
  reasons: string[];
}

export interface Decision {
  goOut: 'go' | 'caution' | 'stay';
  clothing: string;
  equipment: string[];
  goldenWindow: { start: string; end: string } | null;
  thermalShock: { diff: number; warning: boolean };
  activityScores: { activity: string; score: 'good' | 'caution' | 'bad'; label: string }[];
  carWash: 'wash' | 'wait' | 'covered' | null;
  rainNowcast: { raining: boolean; startsIn: number | null; duration: number | null };
  dayNightInfo: { dayStart: string; twilight: string; nightStart: string };
}

function fWind(gusts: number, threshold: number): number {
  if (gusts < threshold * 0.5) return 0;
  if (gusts < threshold) return 15;
  if (gusts < threshold * 1.5) return 35;
  return 60;
}

function fCold(apparentTemp: number, threshold: number): number {
  if (apparentTemp >= threshold + 4) return 0;
  if (apparentTemp >= threshold) return 10;
  if (apparentTemp >= threshold - 4) return 30;
  if (apparentTemp >= threshold - 8) return 50;
  return 70;
}

function fRain(prob: number, rainFeeling: number): number {
  const baseMultiplier = rainFeeling <= 1 ? 1.5 : rainFeeling <= 2 ? 1.0 : 0.7;
  return prob * baseMultiplier;
}

function fShock(todayTemp: number, yesterdayTemp: number): number {
  const diff = Math.abs(todayTemp - yesterdayTemp);
  if (diff >= 8) return 50;
  if (diff >= 5) return 35;
  if (diff >= 3) return 15;
  return 0;
}

export function calculateHourlyRisk(
  profile: Profile,
  weatherData: WeatherData,
  hourIndex: number
): HourlyRisk {
  const { thresholds } = profile;
  const h = weatherData.hourly;
  
  const precipProb = h.precipitation_probability[hourIndex] || 0;
  const windGusts = h.wind_gusts_10m[hourIndex] || 0;
  const apparentTemp = h.apparent_temperature[hourIndex] || 20;
  
  // Yesterday same hour
  const yesterdayIndex = Math.max(0, hourIndex - 24);
  const yesterdayTemp = h.apparent_temperature[yesterdayIndex] || apparentTemp;

  const wRain = thresholds.transport === 'walk' ? 1.5 : 0.7;
  const wWind = 1.0;
  const wCold = 1.2;
  const wShock = 0.8;

  const rainScore = fRain(precipProb, thresholds.rainFeeling) * wRain;
  const windScore = fWind(windGusts, thresholds.windThreshold) * wWind;
  const coldScore = fCold(apparentTemp, thresholds.coldThreshold) * wCold;
  const shockScore = fShock(apparentTemp, yesterdayTemp) * wShock;

  const totalRisk = Math.min(100, Math.round(rainScore + windScore + coldScore + shockScore));

  const reasons: string[] = [];
  if (precipProb > 30) reasons.push(`احتمال بارش ${precipProb}%`);
  if (windGusts > thresholds.windThreshold) reasons.push(`باد ${windGusts} km/h`);
  if (apparentTemp < thresholds.coldThreshold) reasons.push(`دمای احساسی ${Math.round(apparentTemp)}°`);
  if (Math.abs(apparentTemp - yesterdayTemp) >= 5) {
    const diff = Math.round(apparentTemp - yesterdayTemp);
    reasons.push(`${diff > 0 ? 'گرم‌تر' : 'سردتر'} از دیروز (${diff > 0 ? '+' : ''}${diff}°)`);
  }

  let level: 'green' | 'yellow' | 'red';
  if (totalRisk < 30) level = 'green';
  else if (totalRisk < 60) level = 'yellow';
  else level = 'red';

  return {
    hour: h.time[hourIndex],
    riskScore: totalRisk,
    level,
    reasons,
  };
}

export function calculateDecision(profile: Profile, weatherData: WeatherData): Decision {
  const { thresholds } = profile;
  const h = weatherData.hourly;
  const currentIdx = getCurrentHourIndex(h.time);

  // Calculate risks for afternoon/evening hours (16-22)
  const afternoonRisks: HourlyRisk[] = [];
  for (let i = currentIdx; i < h.time.length && i < currentIdx + 24; i++) {
    const timeStr = h.time[i];
    const hour = parseInt(timeStr.split('T')[1]?.substring(0, 2) || '0');
    if (hour >= 16 && hour <= 22) {
      afternoonRisks.push(calculateHourlyRisk(profile, weatherData, i));
    }
  }

  // Golden window: longest consecutive green period in 16-22
  let goldenWindow: { start: string; end: string } | null = null;
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;

  for (let i = 0; i < afternoonRisks.length; i++) {
    if (afternoonRisks[i].level === 'green') {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }

  if (bestLen >= 1 && bestStart >= 0) {
    goldenWindow = {
      start: formatHour(afternoonRisks[bestStart].hour),
      end: formatHour(afternoonRisks[bestStart + bestLen - 1].hour),
    };
  }

  // Current hour risk
  const currentRisk = calculateHourlyRisk(profile, weatherData, currentIdx);
  let goOut: 'go' | 'caution' | 'stay';
  if (currentRisk.level === 'green') goOut = 'go';
  else if (currentRisk.level === 'yellow') goOut = 'caution';
  else goOut = 'stay';

  // If golden window exists and it's before current time, use it
  if (goldenWindow && currentRisk.level !== 'green') {
    goOut = 'caution';
  }

  // Clothing recommendation
  const apparentTemp = h.apparent_temperature[currentIdx] || 20;
  let clothing = '';
  if (apparentTemp < 10) clothing = 'کاپشن زمستانی + لایه میانی + کلاه';
  else if (apparentTemp < 16) clothing = 'کاپشن + لایه نازک';
  else if (apparentTemp < 22) clothing = 'آستین بلند یا سویشرت سبک';
  else clothing = 'لباس سبک';

  // Equipment recommendation
  const equipment: string[] = [];
  const precipProb = h.precipitation_probability[currentIdx] || 0;
  const windGusts = h.wind_gusts_10m[currentIdx] || 0;

  if (precipProb >= 40 && windGusts < 25 && thresholds.equipment.includes('umbrella')) {
    equipment.push('چتر');
  }
  if (precipProb >= 40 && windGusts >= 25) {
    if (thresholds.equipment.includes('raincoat')) equipment.push('بارانی');
    equipment.push('کلاه ضدآب');
  }
  if (windGusts >= 30 && thresholds.equipment.includes('hat')) {
    equipment.push('کلاه محکم');
  }
  const uvIndex = h.uv_index[currentIdx] || 0;
  if (uvIndex > 6 && thresholds.equipment.includes('sunscreen')) {
    equipment.push('ضدآفتاب');
  }
  if (apparentTemp < thresholds.coldThreshold) {
    if (thresholds.equipment.includes('gloves')) equipment.push('دستکش');
  }

  // Thermal shock
  const yesterdayIdx = Math.max(0, currentIdx - 24);
  const todayTemp = h.apparent_temperature[currentIdx] || 20;
  const yesterdayTemp = h.apparent_temperature[yesterdayIdx] || 20;
  const shockDiff = Math.round(todayTemp - yesterdayTemp);
  const thermalShock = {
    diff: shockDiff,
    warning: Math.abs(shockDiff) >= 5,
  };

  // Activity scores
  const activityScores = thresholds.activities.map((activity) => {
    const score = getActivityScore(activity, apparentTemp, precipProb, windGusts, h, currentIdx, thresholds);
    return { activity, score: score.level, label: score.label };
  });

  // Car wash
  let carWash: 'wash' | 'wait' | 'covered' | null = null;
  if (thresholds.hasCar) {
    carWash = getCarWashAdvice(h, currentIdx);
  }

  // Rain nowcast
  const rainNowcast = getRainNowcast(weatherData);

  // Day/night info
  const sunset = weatherData.daily.sunset[0] || '';
  const sunsetTime = sunset.split('T')[1]?.substring(0, 5) || '20:00';
  const sunsetHour = parseInt(sunsetTime.split(':')[0]);
  const dayNightInfo = {
    dayStart: '۱۶:۰۰',
    twilight: `${sunsetTime}`,
    nightStart: `${sunsetHour + 1}:00`,
  };

  return {
    goOut,
    clothing,
    equipment,
    goldenWindow,
    thermalShock,
    activityScores,
    carWash,
    rainNowcast,
    dayNightInfo,
  };
}

function getActivityScore(
  activity: string,
  temp: number,
  precipProb: number,
  windGusts: number,
  h: WeatherData['hourly'],
  currentIdx: number,
  thresholds: Profile['thresholds']
): { level: 'good' | 'caution' | 'bad'; label: string } {
  const isWalker = thresholds.transport === 'walk';

  switch (activity) {
    case 'picnic':
      if (temp >= 18 && temp <= 28 && precipProb < 20 && windGusts < 20) {
        return { level: 'good', label: 'مناسب' };
      }
      if (temp >= 14 && temp <= 32 && precipProb < 40 && windGusts < 30) {
        return { level: 'caution', label: 'با احتیاط' };
      }
      return { level: 'bad', label: 'نامناسب' };

    case 'park':
      if (temp >= 15 && temp <= 30 && precipProb < 30 && windGusts < 25) {
        return { level: 'good', label: 'مناسب' };
      }
      if (precipProb < 50 && windGusts < 35) {
        return { level: 'caution', label: 'با احتیاط' };
      }
      return { level: 'bad', label: 'نامناسب' };

    case 'walk':
      const walkPrecipLimit = isWalker ? 25 : 40;
      if (temp >= 10 && temp <= 28 && precipProb < walkPrecipLimit && windGusts < 30) {
        return { level: 'good', label: 'مناسب' };
      }
      if (precipProb < 50 && windGusts < 40) {
        return { level: 'caution', label: 'با احتیاط' };
      }
      return { level: 'bad', label: 'نامناسب' };

    case 'shopping':
      if (windGusts < 35) {
        // Check for ice
        if (temp < 2 && (h.relative_humidity_2m[currentIdx] || 0) > 80) {
          return { level: 'caution', label: 'مراقب یخ‌زدگی باشید' };
        }
        return { level: 'good', label: 'مناسب' };
      }
      return { level: 'caution', label: 'باد شدید' };

    case 'photography':
      if (windGusts < 20) {
        const hour = parseInt(h.time[currentIdx].split('T')[1]?.substring(0, 2) || '12');
        // Golden hour check (simplified)
        if ((hour >= 17 && hour <= 19) || (hour >= 6 && hour <= 7)) {
          const cloud = h.cloud_cover[currentIdx] || 0;
          if (cloud >= 30 && cloud <= 70) {
            return { level: 'good', label: 'ساعت طلایی عالی!' };
          }
        }
        return { level: 'good', label: 'مناسب' };
      }
      return { level: 'caution', label: 'باد زیاد' };

    case 'exercise':
      if (temp >= 12 && temp <= 28 && precipProb < 20 && windGusts < 25) {
        return { level: 'good', label: 'مناسب' };
      }
      if (precipProb < 40) {
        return { level: 'caution', label: 'با احتیاط' };
      }
      return { level: 'bad', label: 'نامناسب' };

    default:
      return { level: 'good', label: 'مناسب' };
  }
}

function getCarWashAdvice(
  h: WeatherData['hourly'],
  currentIdx: number
): 'wash' | 'wait' | 'covered' {
  // Check next 48 hours for rain
  let rainIn48h = false;
  let rainIn72h = false;

  for (let i = currentIdx; i < Math.min(currentIdx + 48, h.time.length); i++) {
    if ((h.precipitation_probability[i] || 0) > 40) {
      rainIn48h = true;
      break;
    }
  }

  for (let i = currentIdx; i < Math.min(currentIdx + 72, h.time.length); i++) {
    if ((h.precipitation_probability[i] || 0) > 40) {
      rainIn72h = true;
      break;
    }
  }

  if (rainIn48h) return 'wait';
  if (!rainIn72h) return 'wash';
  return 'covered';
}

function getRainNowcast(weatherData: WeatherData): { raining: boolean; startsIn: number | null; duration: number | null } {
  if (!weatherData.minutely_15) {
    return { raining: false, startsIn: null, duration: null };
  }

  const m = weatherData.minutely_15;
  let isRainingNow = false;
  let startsIn: number | null = null;
  let duration = 0;
  let foundRain = false;

  for (let i = 0; i < m.time.length; i++) {
    const precip = m.precipitation[i] || 0;
    if (i === 0 && precip > 0) {
      isRainingNow = true;
    }
    if (!foundRain && precip > 0) {
      startsIn = i * 15; // minutes from now
      foundRain = true;
    }
    if (foundRain && precip > 0) {
      duration += 15;
    } else if (foundRain && precip === 0 && duration > 0) {
      break;
    }
  }

  return { raining: isRainingNow, startsIn, duration: duration || null };
}

export function getWeeklyBestDay(weatherData: WeatherData, profile: Profile): { day: string; risk: number } {
  const days = weatherData.daily.time;
  let bestDay = days[0];
  let bestRisk = 100;

  for (let d = 0; d < days.length; d++) {
    let dayRisk = 0;
    let count = 0;
    for (let i = d * 24; i < (d + 1) * 24 && i < weatherData.hourly.time.length; i++) {
      const hour = parseInt(weatherData.hourly.time[i].split('T')[1]?.substring(0, 2) || '0');
      if (hour >= 16 && hour <= 22) {
        const risk = calculateHourlyRisk(profile, weatherData, i);
        dayRisk += risk.riskScore;
        count++;
      }
    }
    const avgRisk = count > 0 ? dayRisk / count : 50;
    if (avgRisk < bestRisk) {
      bestRisk = avgRisk;
      bestDay = days[d];
    }
  }

  return { day: bestDay, risk: Math.round(bestRisk) };
}

export function getActivityEmoji(activity: string): string {
  switch (activity) {
    case 'picnic': return '🧺';
    case 'park': return '🌳';
    case 'walk': return '🚶';
    case 'shopping': return '🛍️';
    case 'photography': return '📷';
    case 'exercise': return '🏃';
    default: return '✨';
  }
}

export function getDayName(dateStr: string): string {
  const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
  const date = new Date(dateStr);
  const jsDay = date.getUTCDay();
  // Adjust for Iran's week starting on Saturday
  const iranDay = (jsDay + 1) % 7;
  return days[iranDay];
}

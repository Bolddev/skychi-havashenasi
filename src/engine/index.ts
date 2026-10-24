// ============================================================
// اسکای‌چی نسخه ۲.۰ — تابع evaluate (خالص)
// ============================================================

import type {
  WeatherData,
  UserProfile,
  DecisionOutput,
  HourRisk,
  TimeWindow,
  CurrentConditions,
  GoDecision,
} from '../types';
import { calculateAllHourRisks } from './risk';
import { findGoldenWindow, findAcceptableWindow } from './goldenWindow';
import { calculateGoDecision } from './decision';

export interface EvaluateInput {
  weather: WeatherData;
  profile: UserProfile;
  now: Date;
}

export function evaluate(input: EvaluateInput): DecisionOutput {
  const { weather, profile, now } = input;

  // ۱. شرایط فعلی
  const current = buildCurrentConditions(weather, now);

  // ۲. امتیاز خطر ساعتی (۱۶-۲۲)
  const hourlyRisk = calculateAllHourRisks(
    weather.hourly,
    weather.yesterday,
    weather.airQuality,
    profile,
    16,
    22
  );

  // ۳. پنجره طلایی
  const todayDaily = weather.daily[0];
  const { window: goldenWindow, reason: goldenWindowReason } = todayDaily
    ? findGoldenWindow(hourlyRisk, todayDaily, profile)
    : { window: null, reason: 'داده روزانه در دسترس نیست' };

  // ۴. پنجره قابل قبول
  const acceptableWindow = findAcceptableWindow(hourlyRisk, profile);

  // ۵. تصمیم خروج
  const goDecision = todayDaily
    ? calculateGoDecision(goldenWindow, acceptableWindow, hourlyRisk, profile, todayDaily)
    : {
        action: 'stay-indoor' as const,
        message: '❌ داده کافی برای تصمیم‌گیری در دسترس نیست.',
        until: null,
        reasons: [],
      };

  // ۶. محاسبه زمان آخرین به‌روزرسانی
  const minutesAgo = Math.round((now.getTime() - weather.fetchedAt.getTime()) / (60 * 1000));
  const isStale = minutesAgo > 30;

  return {
    version: '2.0.0',
    computedAt: now,
    dataFetchedAt: weather.fetchedAt,

    current,
    hourlyRisk,

    goldenWindow,
    goldenWindowReason,
    acceptableWindow,

    goDecision,

    // بخش ۲ — فعلاً null/خالی
    wearAdvice: null,
    gearAdvice: null,
    nowcast: null,
    temperatureShock: null,
    activityScores: [],
    carWash: null,
    daylightInfo: null,
    bestDay: null,
    weekRanking: [],
    friendComparison: null,
    alerts: [],
    forecastChange: null,
    week: null,
    weeklyTrend: '',
    weekPattern: '',
    departureSuggestion: null,
    nightSky: null,
    pressure: null,

    lastUpdated: {
      at: weather.fetchedAt,
      minutesAgo,
      isStale,
    },
  };
}

// ----- buildCurrentConditions -----
function buildCurrentConditions(weather: WeatherData, now: Date): CurrentConditions {
  // پیدا کردن ساعت فعلی
  const currentHour = now.getHours();
  const currentHourData = weather.hourly.find((h) => h.hour === currentHour);

  if (!currentHourData) {
    // fallback: نزدیک‌ترین ساعت
    const closest = weather.hourly.reduce((min, h) => {
      const diff = Math.abs(h.time.getTime() - now.getTime());
      const minDiff = Math.abs(min.time.getTime() - now.getTime());
      return diff < minDiff ? h : min;
    }, weather.hourly[0]);

    return buildConditionsFromHour(closest);
  }

  return buildConditionsFromHour(currentHourData);
}

function buildConditionsFromHour(h: import('../types').HourlyData): CurrentConditions {
  // تفسیر دما
  let tempInterpretation: string;
  if (h.apparentTemperature < 0) tempInterpretation = 'یخبندان';
  else if (h.apparentTemperature < 10) tempInterpretation = 'خیلی سرد';
  else if (h.apparentTemperature < 16) tempInterpretation = 'سرد';
  else if (h.apparentTemperature < 22) tempInterpretation = 'مطبوع';
  else if (h.apparentTemperature < 28) tempInterpretation = 'گرم';
  else if (h.apparentTemperature < 35) tempInterpretation = 'خیلی گرم';
  else tempInterpretation = 'سوزان';

  // تفسیر رطوبت
  let humidityLabel: string;
  if (h.relativeHumidity < 30) humidityLabel = 'خشک';
  else if (h.relativeHumidity < 50) humidityLabel = 'معمولی';
  else if (h.relativeHumidity < 70) humidityLabel = 'مرطوب';
  else humidityLabel = 'خیلی مرطوب';

  // تفسیر ابر
  let cloudLabel: string;
  if (h.cloudCover < 20) cloudLabel = 'صاف';
  else if (h.cloudCover < 50) cloudLabel = 'نیمه‌ابری';
  else if (h.cloudCover < 80) cloudLabel = 'ابری';
  else cloudLabel = 'کاملاً ابری';

  // تفسیر وزش باد
  let gustLabel: string;
  if (h.windGusts < 15) gustLabel = 'ملایم';
  else if (h.windGusts < 25) gustLabel = 'متوسط';
  else if (h.windGusts < 40) gustLabel = 'شدید';
  else gustLabel = 'طوفانی';

  // جهت باد
  let windDirLabel: string;
  const dir = h.windDirection;
  if (dir >= 337.5 || dir < 22.5) windDirLabel = 'شمال';
  else if (dir < 67.5) windDirLabel = 'شمال‌شرق';
  else if (dir < 112.5) windDirLabel = 'شرق';
  else if (dir < 157.5) windDirLabel = 'جنوب‌شرق';
  else if (dir < 202.5) windDirLabel = 'جنوب';
  else if (dir < 247.5) windDirLabel = 'جنوب‌غرب';
  else if (dir < 292.5) windDirLabel = 'غرب';
  else windDirLabel = 'شمال‌غرب';

  // تفسیر بارش
  let precipLabel: string;
  if (h.precipitationProbability < 10) precipLabel = 'بدون بارش';
  else if (h.precipitationProbability < 30) precipLabel = 'احتمال کم';
  else if (h.precipitationProbability < 60) precipLabel = 'احتمال متوسط';
  else precipLabel = 'احتمال زیاد';

  // کد هوا
  let weatherLabel: string;
  const code = h.weatherCode;
  if (code === 0) weatherLabel = 'صاف';
  else if (code <= 3) weatherLabel = 'نیمه‌ابری';
  else if (code <= 48) weatherLabel = 'مه‌آلود';
  else if (code <= 67) weatherLabel = 'بارانی';
  else if (code <= 77) weatherLabel = 'برفی';
  else if (code <= 82) weatherLabel = 'رگبار';
  else weatherLabel = 'رعد و برق';

  // UV
  let uvLabel: string;
  if (h.uvIndex <= 2) uvLabel = 'کم';
  else if (h.uvIndex <= 5) uvLabel = 'متوسط';
  else if (h.uvIndex <= 7) uvLabel = 'بالا';
  else if (h.uvIndex <= 10) uvLabel = 'خیلی بالا';
  else uvLabel = 'خطرناک';

  // دید
  let visibilityLabel: string;
  if (h.visibility == null) visibilityLabel = 'نامشخص';
  else if (h.visibility < 1000) visibilityLabel = 'خیلی کم';
  else if (h.visibility < 4000) visibilityLabel = 'کم';
  else if (h.visibility < 10000) visibilityLabel = 'متوسط';
  else visibilityLabel = 'خوب';

  // خلاصه
  const summary = `${weatherLabel}، ${tempInterpretation} (${Math.round(h.apparentTemperature)}°)، ${precipLabel}`;

  return {
    time: h.time,
    temperature: h.temperature,
    apparentTemperature: h.apparentTemperature,
    temperatureInterpretation: tempInterpretation,
    humidity: h.relativeHumidity,
    humidityLabel,
    dewPoint: h.dewPoint,
    cloudCover: h.cloudCover,
    cloudLabel,
    windSpeed: h.windSpeed,
    windGusts: h.windGusts,
    windGustLabel: gustLabel,
    windDirection: h.windDirection,
    windDirectionLabel: windDirLabel,
    precipitationProbability: h.precipitationProbability,
    precipitation: h.precipitation,
    precipitationLabel: precipLabel,
    weatherCode: h.weatherCode,
    weatherLabel,
    uvIndex: h.uvIndex,
    uvLabel,
    visibility: h.visibility,
    visibilityLabel,
    aqi: null,
    aqiLabel: 'نامشخص',
    summary,
  };
}

// ============================================================
// اسکای‌چی نسخه ۲.۰ — تابع evaluate (خالص)
// ============================================================

import type {
  WeatherData,
  UserProfile,
  DecisionOutput,
  CurrentConditions,
} from '../types';
import { calculateAllHourRisks } from './risk';
import { findGoldenWindow, findAcceptableWindow } from './goldenWindow';
import { calculateGoDecision } from './decision';
import { generateWearAdvice, generateGearAdvice } from './wearGear';
import { computeNowcast } from './nowcast';
import { detectTemperatureShock } from './shock';
import { calculateActivityScores } from './activities';
import { calculateCarWash } from './carWash';
import { calculateDaylightInfo } from './daylight';
import { generateAlerts } from './alerts';
import { calculateWeekRanking, calculateWeeklyTrend, calculateWeekPattern, buildWeekForecast } from './week';
import { compareProfiles } from './compare';
import { detectForecastChange } from './forecastChange';
import { computeNightSky } from './nightSky';
import { computePressure } from './pressure';
import { calculateDepartureSuggestion, calculateDurationSuggestion } from './departure';
import {
  interpretTemperature,
  interpretHumidity,
  interpretCloudCover,
  interpretWindGust,
  interpretWindDirection,
  interpretUV,
  interpretAQI,
  interpretWeatherCode,
  buildSummary,
} from './interpretations';

export interface EvaluateInput {
  weather: WeatherData;
  profile: UserProfile;
  allProfiles?: UserProfile[];
  now: Date;
  forecastSnapshot?: import('../types').ForecastSnapshot | null;
}

export function evaluate(input: EvaluateInput): DecisionOutput {
  const { weather, profile, allProfiles, now, forecastSnapshot } = input;

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

  // ۶. پوشش و تجهیزات
  const wearAdvice = generateWearAdvice(goldenWindow, weather, profile);
  const gearAdvice = generateGearAdvice(goldenWindow, weather, profile);

  // ۷. Nowcast
  const nowcast = computeNowcast(weather.minutely15, now);

  // ۸. شوک دمایی
  const temperatureShock = detectTemperatureShock(weather.hourly, weather.yesterday);

  // ۹. امتیاز فعالیت‌ها
  const activityScores = calculateActivityScores(weather, profile);

  // ۱۰. کارواش
  const carWash = calculateCarWash(weather, profile, now);

  // ۱۱. اطلاعات خورشید
  const daylightInfo = todayDaily ? calculateDaylightInfo(todayDaily, now) : null;

  // ۱۲. هشدارها
  const alerts = generateAlerts(weather, now);

  // ۱۳. هفته
  const weekRanking = calculateWeekRanking(weather, profile);
  const weeklyTrend = calculateWeeklyTrend(weather);
  const weekPattern = calculateWeekPattern(weather);
  const week = buildWeekForecast(weather, profile);
  const bestDay = weekRanking.length > 0 ? weekRanking[0] : null;

  // ۱۴. مقایسه پروفایل‌ها
  const friendComparison = allProfiles
    ? compareProfiles(allProfiles, weather, profile.id)
    : null;

  // ۱۵. تغییر پیش‌بینی
  const forecastChange = detectForecastChange(weather.hourly, forecastSnapshot ?? null);

  // ۱۶. آسمان شب
  const nightSky = daylightInfo
    ? computeNightSky(weather.hourly, now, daylightInfo.sunset)
    : null;

  // ۱۷. فشار هوا
  const pressure = computePressure(weather.hourly, now);

  // ۱۸. زمان حرکت
  const departureSuggestion = calculateDepartureSuggestion(goldenWindow, profile, now);

  // ۱۹. مدت پیشنهادی
  const durationSuggestion = calculateDurationSuggestion(goldenWindow, profile.typicalOutingDuration);

  // ۲۰. زمان آخرین به‌روزرسانی
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

    wearAdvice,
    gearAdvice,
    nowcast,
    temperatureShock,
    activityScores,
    carWash,
    daylightInfo,
    bestDay,
    weekRanking,
    friendComparison,
    alerts,
    forecastChange,
    week,
    weeklyTrend,
    weekPattern,
    departureSuggestion,
    nightSky,
    pressure,

    lastUpdated: {
      at: weather.fetchedAt,
      minutesAgo,
      isStale,
    },
  };
}

// ----- buildCurrentConditions -----
function buildCurrentConditions(weather: WeatherData, now: Date): CurrentConditions {
  const currentHour = now.getHours();
  let currentHourData = weather.hourly.find((h) => h.hour === currentHour);

  if (!currentHourData) {
    currentHourData = weather.hourly.reduce((min, h) => {
      const diff = Math.abs(h.time.getTime() - now.getTime());
      const minDiff = Math.abs(min.time.getTime() - now.getTime());
      return diff < minDiff ? h : min;
    }, weather.hourly[0]);
  }

  const h = currentHourData;

  // تفسیرها
  const temperatureInterpretation = interpretTemperature(h.temperature, h.apparentTemperature);
  const humidityLabel = interpretHumidity(h.relativeHumidity);
  const cloudLabel = interpretCloudCover(h.cloudCover);
  const windGustLabel = interpretWindGust(h.windGusts);
  const windDirInfo = interpretWindDirection(h.windDirection);
  const uvInfo = interpretUV(h.uvIndex);
  const weatherInfo = interpretWeatherCode(h.weatherCode);

  let precipLabel: string;
  if (h.precipitationProbability < 10) precipLabel = 'بدون بارش';
  else if (h.precipitationProbability < 30) precipLabel = 'احتمال کم';
  else if (h.precipitationProbability < 60) precipLabel = 'احتمال متوسط';
  else precipLabel = 'احتمال زیاد';

  let visibilityLabel: string;
  if (h.visibility == null) visibilityLabel = 'نامشخص';
  else if (h.visibility < 1000) visibilityLabel = 'خیلی کم';
  else if (h.visibility < 4000) visibilityLabel = 'کم';
  else if (h.visibility < 10000) visibilityLabel = 'متوسط';
  else visibilityLabel = 'خوب';

  const aqi = weather.airQuality?.[0]?.europeanAqi ?? null;
  const aqiInfo = aqi != null ? interpretAQI(aqi) : { label: 'نامشخص', advice: '' };

  const summary = buildSummary(
    'go', // فعلاً ساده
    null
  );

  return {
    time: h.time,
    temperature: h.temperature,
    apparentTemperature: h.apparentTemperature,
    temperatureInterpretation,
    humidity: h.relativeHumidity,
    humidityLabel,
    dewPoint: h.dewPoint,
    cloudCover: h.cloudCover,
    cloudLabel,
    windSpeed: h.windSpeed,
    windGusts: h.windGusts,
    windGustLabel,
    windDirection: h.windDirection,
    windDirectionLabel: windDirInfo.label,
    precipitationProbability: h.precipitationProbability,
    precipitation: h.precipitation,
    precipitationLabel: precipLabel,
    weatherCode: h.weatherCode,
    weatherLabel: weatherInfo.label,
    uvIndex: h.uvIndex,
    uvLabel: uvInfo.label,
    visibility: h.visibility,
    visibilityLabel,
    aqi,
    aqiLabel: aqiInfo.label,
    summary,
  };
}

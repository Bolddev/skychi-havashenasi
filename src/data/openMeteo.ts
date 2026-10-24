// ============================================================
// اسکای‌چی نسخه ۲.۰ — لایه داده Open-Meteo
// ============================================================

import type { WeatherData, AirQualityData } from '../types';
import { normalizeWeatherData, OpenMeteoRaw, OpenMeteoAirQualityRaw } from './normalizer';
import { getCachedWeather, setCachedWeather } from './cache';
import { NetworkError, ServerError, ParseError } from './errors';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const AQ_BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const LATITUDE = 35.4287;
const LONGITUDE = 51.5754;
const TIMEZONE = 'Asia/Tehran';

export async function fetchWeather(useCache: boolean = true): Promise<WeatherData> {
  // بررسی کش
  if (useCache) {
    const cached = getCachedWeather();
    if (cached) {
      return cached;
    }
  }

  const hourlyParams = [
    'temperature_2m',
    'apparent_temperature',
    'relative_humidity_2m',
    'dew_point_2m',
    'precipitation_probability',
    'precipitation',
    'rain',
    'showers',
    'snowfall',
    'weather_code',
    'cloud_cover',
    'visibility',
    'wind_speed_10m',
    'wind_gusts_10m',
    'wind_direction_10m',
    'uv_index',
    'is_day',
    'surface_pressure',
  ].join(',');

  const dailyParams = [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'apparent_temperature_max',
    'apparent_temperature_min',
    'sunrise',
    'sunset',
    'daylight_duration',
    'precipitation_probability_max',
    'precipitation_sum',
    'wind_speed_10m_max',
    'wind_gusts_10m_max',
    'uv_index_max',
  ].join(',');

  const url = `${BASE_URL}?latitude=${LATITUDE}&longitude=${LONGITUDE}&timezone=${TIMEZONE}&hourly=${hourlyParams}&daily=${dailyParams}&minutely_15=precipitation,precipitation_probability&past_days=1&forecast_days=7`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new NetworkError();
  }

  if (!response.ok) {
    throw new ServerError(response.status);
  }

  let rawData: OpenMeteoRaw;
  try {
    rawData = await response.json();
  } catch (e) {
    throw new ParseError();
  }

  // دریافت کیفیت هوا (اختیاری)
  let airQualityRaw: OpenMeteoAirQualityRaw | undefined;
  try {
    const aqResponse = await fetch(
      `${AQ_BASE_URL}?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=pm10,pm2_5,european_aqi,us_aqi,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=${TIMEZONE}`
    );
    if (aqResponse.ok) {
      airQualityRaw = await aqResponse.json();
    }
  } catch (e) {
    // کیفیت هوا اختیاری است
    console.warn('Air quality fetch failed:', e);
  }

  const weatherData = normalizeWeatherData(rawData, undefined, airQualityRaw);

  // ذخیره در کش
  setCachedWeather(weatherData);

  return weatherData;
}

export async function fetchAirQuality(): Promise<AirQualityData[] | null> {
  try {
    const response = await fetch(
      `${AQ_BASE_URL}?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=pm10,pm2_5,european_aqi,us_aqi,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=${TIMEZONE}`
    );

    if (!response.ok) {
      return null;
    }

    const raw: OpenMeteoAirQualityRaw = await response.json();

    if (!raw.current) {
      return null;
    }

    const c = raw.current;
    return [
      {
        time: new Date(c.time),
        pm10: c.pm10 ?? null,
        pm2_5: c.pm2_5 ?? null,
        europeanAqi: c.european_aqi ?? null,
        usAqi: c.us_aqi ?? null,
        carbonMonoxide: c.carbon_monoxide ?? null,
        nitrogenDioxide: c.nitrogen_dioxide ?? null,
        sulphurDioxide: c.sulphur_dioxide ?? null,
        ozone: c.ozone ?? null,
      },
    ];
  } catch (e) {
    console.warn('Air quality fetch failed:', e);
    return null;
  }
}

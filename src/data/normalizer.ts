// ============================================================
// اسکای‌چی نسخه ۲.۰ — نرمال‌ساز داده Open-Meteo
// ============================================================

import type { WeatherData, HourlyData, DailyData, MinutelyData, AirQualityData } from '../types';

// داده خام Open-Meteo
export interface OpenMeteoRaw {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly?: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    relative_humidity_2m: number[];
    dew_point_2m?: number[];
    precipitation_probability: number[];
    precipitation: number[];
    rain?: number[];
    showers?: number[];
    snowfall?: number[];
    weather_code: number[];
    cloud_cover: number[];
    visibility?: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    wind_direction_10m?: number[];
    uv_index: number[];
    is_day?: number[];
    surface_pressure?: number[];
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max?: number[];
    apparent_temperature_min?: number[];
    sunrise: string[];
    sunset: string[];
    daylight_duration?: number[];
    precipitation_probability_max: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
    wind_gusts_10m_max: number[];
    uv_index_max: number[];
  };
  minutely_15?: {
    time: string[];
    precipitation: number[];
    precipitation_probability?: number[];
  };
  current?: {
    time: string;
    temperature_2m: number;
    // ...
  };
}

export interface OpenMeteoAirQualityRaw {
  current?: {
    time: string;
    pm10?: number;
    pm2_5?: number;
    european_aqi?: number;
    us_aqi?: number;
    carbon_monoxide?: number;
    nitrogen_dioxide?: number;
    sulphur_dioxide?: number;
    ozone?: number;
  };
}

export function normalizeWeatherData(
  raw: OpenMeteoRaw,
  yesterdayRaw?: OpenMeteoRaw,
  airQualityRaw?: OpenMeteoAirQualityRaw
): WeatherData {
  const now = new Date();

  // نرمال‌سازی hourly
  const hourly: HourlyData[] = [];
  if (raw.hourly) {
    const h = raw.hourly;
    for (let i = 0; i < h.time.length; i++) {
      const time = new Date(h.time[i]);
      hourly.push({
        time,
        hour: time.getHours(),
        temperature: h.temperature_2m[i] ?? 0,
        apparentTemperature: h.apparent_temperature[i] ?? 0,
        relativeHumidity: h.relative_humidity_2m[i] ?? 0,
        dewPoint: h.dew_point_2m?.[i] ?? 0,
        precipitationProbability: h.precipitation_probability[i] ?? 0,
        precipitation: h.precipitation[i] ?? 0,
        rain: h.rain?.[i] ?? 0,
        showers: h.showers?.[i] ?? 0,
        snowfall: h.snowfall?.[i] ?? 0,
        weatherCode: h.weather_code[i] ?? 0,
        cloudCover: h.cloud_cover[i] ?? 0,
        visibility: h.visibility?.[i] ?? null,
        windSpeed: h.wind_speed_10m[i] ?? 0,
        windGusts: h.wind_gusts_10m[i] ?? 0,
        windDirection: h.wind_direction_10m?.[i] ?? 0,
        uvIndex: h.uv_index[i] ?? 0,
        isDay: h.is_day ? h.is_day[i] === 1 : true,
        surfacePressure: h.surface_pressure?.[i] ?? null,
      });
    }
  }

  // نرمال‌سازی daily
  const daily: DailyData[] = [];
  if (raw.daily) {
    const d = raw.daily;
    // حذف تکراری‌ها (باگ ۴)
    const seenDates = new Set<string>();
    for (let i = 0; i < d.time.length; i++) {
      const dateStr = d.time[i].split('T')[0];
      if (seenDates.has(dateStr)) continue;
      seenDates.add(dateStr);

      const date = new Date(d.time[i]);
      daily.push({
        date,
        weatherCode: d.weather_code[i] ?? 0,
        tempMax: d.temperature_2m_max[i] ?? 0,
        tempMin: d.temperature_2m_min[i] ?? 0,
        apparentTempMax: d.apparent_temperature_max?.[i] ?? d.temperature_2m_max[i] ?? 0,
        apparentTempMin: d.apparent_temperature_min?.[i] ?? d.temperature_2m_min[i] ?? 0,
        sunrise: new Date(d.sunrise[i]),
        sunset: new Date(d.sunset[i]),
        daylightDuration: d.daylight_duration?.[i] ?? 0,
        precipitationProbabilityMax: d.precipitation_probability_max[i] ?? 0,
        precipitationSum: d.precipitation_sum?.[i] ?? 0,
        windSpeedMax: d.wind_speed_10m_max?.[i] ?? 0,
        windGustsMax: d.wind_gusts_10m_max[i] ?? 0,
        uvIndexMax: d.uv_index_max[i] ?? 0,
      });
    }

    // محدود به ۷ روز از امروز
    const todayStr = now.toISOString().split('T')[0];
    const filtered = daily.filter((d) => d.date.toISOString().split('T')[0] >= todayStr);
    daily.length = 0;
    daily.push(...filtered.slice(0, 7));

    // اضافه کردن label
    for (let i = 0; i < daily.length; i++) {
      const dayDate = daily[i].date.toISOString().split('T')[0];
      const todayDate = now.toISOString().split('T')[0];
      const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayAfterDate = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (dayDate === todayDate) daily[i].label = 'امروز';
      else if (dayDate === tomorrowDate) daily[i].label = 'فردا';
      else if (dayDate === dayAfterDate) daily[i].label = 'پس‌فردا';
    }
  }

  // نرمال‌سازی minutely_15
  let minutely15: MinutelyData[] | null = null;
  if (raw.minutely_15) {
    minutely15 = raw.minutely_15.time.map((t, i) => ({
      time: new Date(t),
      precipitation: raw.minutely_15!.precipitation[i] ?? 0,
      precipitationProbability: raw.minutely_15!.precipitation_probability?.[i] ?? 0,
    }));
  }

  // نرمال‌سازی air quality
  let airQuality: AirQualityData[] | null = null;
  if (airQualityRaw?.current) {
    const c = airQualityRaw.current;
    airQuality = [{
      time: new Date(c.time),
      pm10: c.pm10 ?? null,
      pm2_5: c.pm2_5 ?? null,
      europeanAqi: c.european_aqi ?? null,
      usAqi: c.us_aqi ?? null,
      carbonMonoxide: c.carbon_monoxide ?? null,
      nitrogenDioxide: c.nitrogen_dioxide ?? null,
      sulphurDioxide: c.sulphur_dioxide ?? null,
      ozone: c.ozone ?? null,
    }];
  }

  // نرمال‌سازی yesterday
  let yesterday: HourlyData[] | null = null;
  if (yesterdayRaw?.hourly) {
    const h = yesterdayRaw.hourly;
    yesterday = [];
    for (let i = 0; i < h.time.length; i++) {
      const time = new Date(h.time[i]);
      yesterday.push({
        time,
        hour: time.getHours(),
        temperature: h.temperature_2m[i] ?? 0,
        apparentTemperature: h.apparent_temperature[i] ?? 0,
        relativeHumidity: h.relative_humidity_2m[i] ?? 0,
        dewPoint: h.dew_point_2m?.[i] ?? 0,
        precipitationProbability: h.precipitation_probability[i] ?? 0,
        precipitation: h.precipitation[i] ?? 0,
        rain: h.rain?.[i] ?? 0,
        showers: h.showers?.[i] ?? 0,
        snowfall: h.snowfall?.[i] ?? 0,
        weatherCode: h.weather_code[i] ?? 0,
        cloudCover: h.cloud_cover[i] ?? 0,
        visibility: h.visibility?.[i] ?? null,
        windSpeed: h.wind_speed_10m[i] ?? 0,
        windGusts: h.wind_gusts_10m[i] ?? 0,
        windDirection: h.wind_direction_10m?.[i] ?? 0,
        uvIndex: h.uv_index[i] ?? 0,
        isDay: h.is_day ? h.is_day[i] === 1 : true,
        surfacePressure: h.surface_pressure?.[i] ?? null,
      });
    }
  }

  return {
    location: {
      lat: raw.latitude,
      lon: raw.longitude,
      name: 'قرچک، تهران',
    },
    timezone: raw.timezone,
    fetchedAt: now,
    hourly,
    daily,
    minutely15,
    airQuality,
    yesterday,
  };
}

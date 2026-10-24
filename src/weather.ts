import { WeatherData } from './store';

const BASE_URL = 'https://api.open-meteo.com/v1';
const LATITUDE = 35.4287;
const LONGITUDE = 51.5754;
const TIMEZONE = 'Asia/Tehran';

export async function fetchWeatherData(): Promise<WeatherData> {
  const hourlyParams = [
    'temperature_2m',
    'apparent_temperature',
    'relative_humidity_2m',
    'precipitation_probability',
    'precipitation',
    'rain',
    'wind_speed_10m',
    'wind_gusts_10m',
    'cloud_cover',
    'uv_index',
    'visibility',
    'weather_code',
  ].join(',');

  const dailyParams = [
    'sunrise',
    'sunset',
    'precipitation_probability_max',
    'wind_gusts_10m_max',
    'uv_index_max',
  ].join(',');

  const url = `${BASE_URL}/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&timezone=${TIMEZONE}&hourly=${hourlyParams}&daily=${dailyParams}&minutely_15=precipitation&past_days=1&forecast_days=7`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    hourly: data.hourly,
    daily: data.daily,
    minutely_15: data.minutely_15,
  };
}

export async function fetchAirQuality(): Promise<{
  pm2_5: number;
  pm10: number;
  us_aqi: number;
}> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=pm2_5,pm10,us_aqi&timezone=${TIMEZONE}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Air Quality API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    pm2_5: data.current?.pm2_5 || 0,
    pm10: data.current?.pm10 || 0,
    us_aqi: data.current?.us_aqi || 0,
  };
}

export function getHourIndex(timeStr: string, hourlyTimes: string[]): number {
  const idx = hourlyTimes.indexOf(timeStr);
  return idx >= 0 ? idx : -1;
}

export function getCurrentHourIndex(hourlyTimes: string[]): number {
  const now = new Date();
  const tehranOffset = 3.5 * 60 * 60 * 1000;
  const tehranNow = new Date(now.getTime() + tehranOffset);
  const dateStr = tehranNow.toISOString().split('T')[0];
  const hour = tehranNow.getUTCHours();
  const targetTime = `${dateStr}T${String(hour).padStart(2, '0')}:00`;
  
  const idx = hourlyTimes.indexOf(targetTime);
  if (idx >= 0) return idx;
  
  // Find closest hour
  for (let i = 0; i < hourlyTimes.length; i++) {
    if (hourlyTimes[i] >= targetTime) return i;
  }
  return hourlyTimes.length - 1;
}

export function getTodaySunrise(daily: WeatherData['daily']): string {
  return daily.sunrise[0] || '';
}

export function getTodaySunset(daily: WeatherData['daily']): string {
  return daily.sunset[0] || '';
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const time = timeStr.split('T')[1];
  if (!time) return '';
  return time.substring(0, 5);
}

export function formatHour(timeStr: string): string {
  if (!timeStr) return '';
  const time = timeStr.split('T')[1];
  if (!time) return '';
  const hour = parseInt(time.substring(0, 2));
  return `${hour}:00`;
}

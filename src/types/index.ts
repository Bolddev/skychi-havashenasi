// ============================================================
// اسکای‌چی نسخه ۲.۰ — تایپ‌ها و قراردادها
// ============================================================

// ----- Activity & Gear -----
export type Activity = 'park' | 'walking' | 'picnic' | 'shopping' | 'sports' | 'photography';
export type Gear = 'umbrella' | 'raincoat' | 'jacket' | 'hat' | 'gloves' | 'sunscreen';

// ----- UserProfile (گسترش‌یافته) -----
export interface UserProfile {
  id: string;
  name: string;
  coldComfortThreshold: number; // °C
  heatThreshold: number; // °C
  windAnnoyThreshold: number; // km/h
  breezeAnnoyThreshold: number; // km/h
  uvThreshold: number;
  humidityWeight: number;
  rainWeight: number;
  snowWeight: number;
  weights: {
    rain: number;
    wind: number;
    cold: number;
    shock: number;
    uv: number;
    air: number;
  };
  dayNightPreference: 'day' | 'any' | 'night';
  showGoldenHour: boolean;
  transport: 'walking' | 'bike' | 'motorcycle' | 'car' | 'public';
  activities: Activity[];
  typicalOutingDuration: number; // hours
  gear: Gear[];
  umbrellaBadInWind: boolean;
  hasCar: boolean;
  parking?: 'street' | 'covered' | 'open';
  carWashImportance?: 'high' | 'medium' | 'low';
  hasSnowChains?: boolean;
  seasonalAllergy?: boolean;
  jointPain?: boolean;
  respiratoryIssue?: boolean;
  notifications: {
    enabled: boolean;
    times: string[];
    leadTime: number; // minutes
  };
  walkingTimeMinutes?: number; // default 15
  hasIndoorAlternatives?: boolean;
}

// ----- HourlyData -----
export interface HourlyData {
  time: Date;
  hour: number; // 0-23
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  dewPoint: number;
  precipitationProbability: number; // 0-100
  precipitation: number; // mm
  rain: number; // mm
  showers: number; // mm
  snowfall: number; // cm
  weatherCode: number;
  cloudCover: number; // %
  visibility?: number | null; // m
  windSpeed: number; // km/h
  windGusts: number; // km/h
  windDirection: number; // degrees
  uvIndex: number;
  isDay: boolean;
  surfacePressure?: number | null; // hPa
}

// ----- DailyData -----
export interface DailyData {
  date: Date;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  apparentTempMax: number;
  apparentTempMin: number;
  sunrise: Date;
  sunset: Date;
  daylightDuration: number; // seconds
  precipitationProbabilityMax: number;
  precipitationSum: number; // mm
  windSpeedMax: number;
  windGustsMax: number;
  uvIndexMax: number;
  label?: string;
}

// ----- MinutelyData -----
export interface MinutelyData {
  time: Date;
  precipitation: number;
  precipitationProbability: number;
}

// ----- AirQualityData -----
export interface AirQualityData {
  time: Date;
  pm10?: number | null;
  pm2_5?: number | null;
  europeanAqi?: number | null;
  usAqi?: number | null;
  carbonMonoxide?: number | null;
  nitrogenDioxide?: number | null;
  sulphurDioxide?: number | null;
  ozone?: number | null;
}

// ----- WeatherData -----
export interface WeatherData {
  location: { lat: number; lon: number; name: string };
  timezone: string;
  fetchedAt: Date;
  hourly: HourlyData[];
  daily: DailyData[];
  minutely15?: MinutelyData[] | null;
  airQuality?: AirQualityData[] | null;
  yesterday?: HourlyData[] | null;
}

// ----- HourRisk (گسترش‌یافته با Breakdown) -----
export interface BreakdownItem {
  score: number;
  detail: string;
}

export interface HourRiskBreakdown {
  cold: BreakdownItem;
  wind: BreakdownItem;
  rain: BreakdownItem;
  shock: BreakdownItem;
  uv: BreakdownItem;
  air: BreakdownItem;
}

export interface HourRisk {
  hour: number; // 0-23
  time: Date;
  risk: number | null; // 0-100 or null if no data
  label: 'safe' | 'caution' | 'danger' | 'no-data';
  breakdown: HourRiskBreakdown;
  rawData: HourlyData;
  advice: string[];
}

// ----- TimeWindow -----
export interface TimeWindow {
  start: Date;
  end: Date;
  durationMinutes: number;
  averageRisk: number;
}

// ----- NowcastState -----
export type NowcastState =
  | { status: 'dry-next-2h'; message: string }
  | { status: 'raining-now'; message: string; endsAt?: Date; continuesPast2h?: boolean }
  | { status: 'rain-starting-soon'; message: string; startsAt: Date; durationMinutes?: number; minutesUntilRain: number }
  | { status: 'no-data'; message: string };

// ----- ShockWarning -----
export interface ShockWarning {
  magnitude: number;
  direction: 'colder' | 'warmer';
  hour: number;
  message: string;
  severity: 'medium' | 'high';
}

// ----- ActivityScore -----
export interface ActivityScore {
  activity: Activity;
  status: 'good' | 'caution' | 'bad';
  bestWindow: TimeWindow | null;
  reasons: string[];
  limitingFactors: string[];
}

// ----- DaylightInfo -----
export interface DaylightInfo {
  sunrise: Date;
  sunset: Date;
  civilTwilightStart: Date;
  civilTwilightEnd: Date;
  goldenHourMorning: { start: Date; end: Date };
  goldenHourEvening: { start: Date; end: Date };
  isDay: boolean;
  timeUntilSunset?: number; // minutes
  timeUntilSunrise?: number; // minutes
}

// ----- Alert -----
export interface Alert {
  type: 'wind' | 'fog' | 'ice' | 'air' | 'uv' | 'temperature';
  severity: 'info' | 'warning' | 'danger';
  message: string;
  icon: string;
  validFrom: Date;
  validUntil: Date;
}

// ----- DayRanking -----
export interface DayRanking {
  date: Date;
  status: 'good' | 'caution' | 'bad';
  score: number;
  reasons: string[];
  limitingFactor: string | null;
  label?: string;
}

// ----- CarWashDecision -----
export interface CarWashDecision {
  recommendation: 'wash' | 'dont-wash' | 'covered-parking';
  nextRainDate?: Date | null;
  hoursUntilRain?: number | null;
  parkingAdvice?: string;
  reason: string;
}

// ----- ForecastSnapshot & ForecastChange -----
export interface ForecastSnapshot {
  capturedAt: Date;
  hourly: { hour: number; apparentTemperature: number; precipitationProbability: number }[];
}

export interface ForecastChange {
  changes: {
    type: 'rain' | 'temperature';
    hour: number;
    from: number;
    to: number;
    message: string;
  }[];
}

// ----- NightSkyInfo -----
export interface NightSkyInfo {
  cloudCover: number;
  visibility?: number | null;
  moonPhase: number; // 0-1
  moonIllumination: number; // 0-100
  isGoodForStargazing: boolean;
  message: string;
}

// ----- FriendComparison -----
export interface FriendComparison {
  activeProfileWindow: TimeWindow | null;
  friendProfilesWindows: { profileId: string; name: string; window: TimeWindow | null }[];
  overlapWindow: TimeWindow | null;
  message: string;
}

// ----- PressureInfo -----
export interface PressureInfo {
  value: number; // hPa
  trend: 'rising' | 'falling' | 'steady';
  label: string;
}

// ----- GoDecision -----
export interface GoDecision {
  action: 'go' | 'go-until' | 'go-covered' | 'stay-indoor';
  message: string;
  until: Date | null;
  reasons: string[];
}

// ----- AdviceWithReasons -----
export interface AdviceWithReasons {
  items: { item: string; reason: string }[];
  summary: string;
}

// ----- GearAdvice -----
export interface GearAdvice {
  items: { gear: Gear; reason: string }[];
  summary: string;
}

// ----- CurrentConditions -----
export interface CurrentConditions {
  time: Date;
  temperature: number;
  apparentTemperature: number;
  temperatureInterpretation: string;
  humidity: number;
  humidityLabel: string;
  dewPoint: number;
  cloudCover: number;
  cloudLabel: string;
  windSpeed: number;
  windGusts: number;
  windGustLabel: string;
  windDirection: number;
  windDirectionLabel: string;
  precipitationProbability: number;
  precipitation: number;
  precipitationLabel: string;
  weatherCode: number;
  weatherLabel: string;
  uvIndex: number;
  uvLabel: string;
  visibility?: number | null;
  visibilityLabel: string;
  aqi?: number | null;
  aqiLabel: string;
  summary: string;
}

// ----- WeekForecast -----
export interface WeekDayForecast {
  date: Date;
  label: string;
  weatherCode: number;
  tempMin: number;
  tempMax: number;
  apparentTempMin: number;
  apparentTempMax: number;
  precipitationProbabilityMax: number;
  precipitationSum: number;
  windSpeedMax: number;
  windGustsMax: number;
  uvIndexMax: number;
  bestWindow: TimeWindow | null;
  status: 'good' | 'caution' | 'bad';
  reasons: string[];
}

export interface WeekForecast {
  days: WeekDayForecast[];
}

// ----- DecisionOutput (خروجی نهایی evaluate) -----
export interface DecisionOutput {
  version: string;
  computedAt: Date;
  dataFetchedAt: Date;

  current: CurrentConditions;
  hourlyRisk: HourRisk[];

  goldenWindow: TimeWindow | null;
  goldenWindowReason: string;
  acceptableWindow: TimeWindow | null;

  goDecision: GoDecision;

  // بخش ۲ — فعلاً nullable
  wearAdvice: AdviceWithReasons | null;
  gearAdvice: GearAdvice | null;
  nowcast: NowcastState | null;
  temperatureShock: ShockWarning | null;
  activityScores: ActivityScore[];
  carWash: CarWashDecision | null;
  daylightInfo: DaylightInfo | null;
  bestDay: DayRanking | null;
  weekRanking: DayRanking[];
  friendComparison: FriendComparison | null;
  alerts: Alert[];
  forecastChange: ForecastChange | null;
  week: WeekForecast | null;
  weeklyTrend: string;
  weekPattern: string;
  departureSuggestion: { time: Date; message: string } | null;
  nightSky: NightSkyInfo | null;
  pressure: PressureInfo | null;

  lastUpdated: {
    at: Date;
    minutesAgo: number;
    isStale: boolean;
  };
}

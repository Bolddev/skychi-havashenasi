import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, WeatherData, DecisionOutput } from './types';
import { normalizeWeatherData, OpenMeteoRaw, OpenMeteoAirQualityRaw } from './data/normalizer';
import { evaluate } from './engine';

// ----- پروفایل‌های پیش‌فرض -----
export const defaultProfileMe: UserProfile = {
  id: 'me',
  name: 'من',
  coldComfortThreshold: 18,
  heatThreshold: 26,
  windAnnoyThreshold: 21,
  breezeAnnoyThreshold: 10,
  uvThreshold: 6,
  humidityWeight: 0.5,
  rainWeight: 1.5,
  snowWeight: 1.2,
  weights: {
    rain: 1.5,
    wind: 1.3,
    cold: 1.5,
    shock: 1.2,
    uv: 0.8,
    air: 0.6,
  },
  dayNightPreference: 'day',
  showGoldenHour: true,
  transport: 'walking',
  activities: ['park', 'walking', 'shopping'],
  typicalOutingDuration: 2,
  gear: ['jacket', 'hat', 'umbrella'],
  umbrellaBadInWind: true,
  hasCar: false,
  seasonalAllergy: false,
  jointPain: false,
  respiratoryIssue: false,
  notifications: { enabled: true, times: ['before'], leadTime: 60 },
  walkingTimeMinutes: 15,
  hasIndoorAlternatives: false,
};

export const defaultProfileFriends: UserProfile = {
  id: 'friends',
  name: 'دوستان',
  coldComfortThreshold: 10,
  heatThreshold: 34,
  windAnnoyThreshold: 39,
  breezeAnnoyThreshold: 25,
  uvThreshold: 8,
  humidityWeight: 0.3,
  rainWeight: 0.7,
  snowWeight: 0.8,
  weights: {
    rain: 0.7,
    wind: 0.8,
    cold: 0.8,
    shock: 0.5,
    uv: 0.5,
    air: 0.4,
  },
  dayNightPreference: 'any',
  showGoldenHour: false,
  transport: 'car',
  activities: ['shopping', 'park'],
  typicalOutingDuration: 3,
  gear: ['jacket'],
  umbrellaBadInWind: false,
  hasCar: true,
  parking: 'street',
  carWashImportance: 'high',
  seasonalAllergy: false,
  jointPain: false,
  respiratoryIssue: false,
  notifications: { enabled: true, times: ['morning'], leadTime: 120 },
  walkingTimeMinutes: 5,
  hasIndoorAlternatives: true,
};

// ----- State -----
interface AppState {
  activeProfileId: string;
  profiles: UserProfile[];
  weatherData: WeatherData | null;
  decision: DecisionOutput | null;
  isLoading: boolean;
  lastFetch: number | null;
  onboardingComplete: boolean;
  currentPage: 'home' | 'week' | 'profiles' | 'settings';

  setActiveProfile: (id: string) => void;
  updateProfile: (id: string, updates: Partial<UserProfile>) => void;
  setWeatherData: (data: WeatherData) => void;
  setDecision: (decision: DecisionOutput) => void;
  setIsLoading: (loading: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setCurrentPage: (page: 'home' | 'week' | 'profiles' | 'settings') => void;
  getActiveProfile: () => UserProfile;
  fetchAndEvaluate: () => Promise<void>;
}

const LATITUDE = 35.4287;
const LONGITUDE = 51.5754;
const TIMEZONE = 'Asia/Tehran';

async function fetchFromOpenMeteo(): Promise<{ main: OpenMeteoRaw; airQuality?: OpenMeteoAirQualityRaw }> {
  const hourlyParams = [
    'temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'dew_point_2m',
    'precipitation_probability', 'precipitation', 'rain', 'showers', 'snowfall',
    'weather_code', 'cloud_cover', 'visibility', 'wind_speed_10m', 'wind_gusts_10m',
    'wind_direction_10m', 'uv_index', 'is_day', 'surface_pressure',
  ].join(',');

  const dailyParams = [
    'weather_code', 'temperature_2m_max', 'temperature_2m_min',
    'apparent_temperature_max', 'apparent_temperature_min',
    'sunrise', 'sunset', 'daylight_duration', 'precipitation_probability_max',
    'precipitation_sum', 'wind_speed_10m_max', 'wind_gusts_10m_max', 'uv_index_max',
  ].join(',');

  const mainUrl = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&timezone=${TIMEZONE}&hourly=${hourlyParams}&daily=${dailyParams}&minutely_15=precipitation,precipitation_probability&past_days=1&forecast_days=7`;

  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=pm10,pm2_5,european_aqi,us_aqi&timezone=${TIMEZONE}`;

  const [mainRes, aqRes] = await Promise.all([
    fetch(mainUrl),
    fetch(aqUrl).catch(() => null),
  ]);

  if (!mainRes.ok) throw new Error(`Weather API error: ${mainRes.status}`);

  const mainData: OpenMeteoRaw = await mainRes.json();
  let airQualityData: OpenMeteoAirQualityRaw | undefined;
  if (aqRes && aqRes.ok) {
    airQualityData = await aqRes.json();
  }

  return { main: mainData, airQuality: airQualityData };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeProfileId: 'me',
      profiles: [defaultProfileMe, defaultProfileFriends],
      weatherData: null,
      decision: null,
      isLoading: false,
      lastFetch: null,
      onboardingComplete: false,
      currentPage: 'home',

      setActiveProfile: (id) => set({ activeProfileId: id }),

      updateProfile: (id, updates) =>
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      setWeatherData: (data) => set({ weatherData: data, lastFetch: Date.now() }),
      setDecision: (decision) => set({ decision }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
      setCurrentPage: (page) => set({ currentPage: page }),

      getActiveProfile: () => {
        const state = get();
        return state.profiles.find((p) => p.id === state.activeProfileId) || state.profiles[0];
      },

      fetchAndEvaluate: async () => {
        const state = get();
        if (state.lastFetch && Date.now() - state.lastFetch < 15 * 60 * 1000 && state.weatherData) {
          // کش معتبر — فقط evaluate مجدد
          const profile = state.getActiveProfile();
          const decision = evaluate({
            weather: state.weatherData,
            profile,
            now: new Date(),
          });
          set({ decision });
          return;
        }

        set({ isLoading: true });
        try {
          const { main, airQuality } = await fetchFromOpenMeteo();
          const weatherData = normalizeWeatherData(main, undefined, airQuality);
          set({ weatherData, lastFetch: Date.now() });

          const profile = get().getActiveProfile();
          const decision = evaluate({
            weather: weatherData,
            profile,
            now: new Date(),
          });
          set({ decision });
        } catch (e) {
          console.error('Failed to fetch weather:', e);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'skychi-storage',
      partialize: (state) => ({
        activeProfileId: state.activeProfileId,
        profiles: state.profiles,
        onboardingComplete: state.onboardingComplete,
      }),
    }
  )
);

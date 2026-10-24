import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProfileThresholds {
  windThreshold: number; // km/h
  coldThreshold: number; // apparent temp °C
  heatThreshold: number; // °C
  breezeThreshold: number; // km/h
  rainFeeling: number; // 1-4 (hate to love)
  snowFeeling: number; // 1-3
  sunFeeling: number; // 1-3
  timePreference: 'day' | 'any' | 'night';
  transport: 'walk' | 'bike' | 'motorcycle' | 'car' | 'public';
  activities: string[];
  duration: '1-2' | '3-4' | '5+';
  equipment: string[];
  hasCar: boolean;
  parking: 'street' | 'covered';
  carWashImportant: 'yes' | 'sometimes' | 'no';
  hasAllergy: boolean;
  hasJointPain: boolean;
  notificationTime: 'morning' | 'noon' | 'before' | 'all';
  notificationBefore: '30' | '60' | '120';
}

export interface Profile {
  id: string;
  name: string;
  thresholds: ProfileThresholds;
}

export const defaultProfileMe: Profile = {
  id: 'me',
  name: 'من',
  thresholds: {
    windThreshold: 21, // 45 - 6*4 (very sensitive)
    coldThreshold: 18,
    heatThreshold: 26,
    breezeThreshold: 10,
    rainFeeling: 1, // hate
    snowFeeling: 2, // don't care
    sunFeeling: 2, // don't care
    timePreference: 'day',
    transport: 'walk',
    activities: ['park', 'walk', 'shopping'],
    duration: '1-2',
    equipment: ['jacket', 'hat', 'umbrella'],
    hasCar: false,
    parking: 'street',
    carWashImportant: 'no',
    hasAllergy: false,
    hasJointPain: false,
    notificationTime: 'before',
    notificationBefore: '60',
  },
};

export const defaultProfileFriends: Profile = {
  id: 'friends',
  name: 'دوستان',
  thresholds: {
    windThreshold: 39, // 45 - 6*1 (not sensitive)
    coldThreshold: 10,
    heatThreshold: 34,
    breezeThreshold: 25,
    rainFeeling: 3, // don't care
    snowFeeling: 2,
    sunFeeling: 2,
    timePreference: 'any',
    transport: 'car',
    activities: ['shopping', 'park'],
    duration: '3-4',
    equipment: ['jacket'],
    hasCar: true,
    parking: 'street',
    carWashImportant: 'yes',
    hasAllergy: false,
    hasJointPain: false,
    notificationTime: 'morning',
    notificationBefore: '120',
  },
};

export interface WeatherData {
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    rain: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    cloud_cover: number[];
    uv_index: number[];
    visibility: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max: number[];
    wind_gusts_10m_max: number[];
    uv_index_max: number[];
  };
  minutely_15?: {
    time: string[];
    precipitation: number[];
  };
}

interface AppState {
  activeProfileId: string;
  profiles: Profile[];
  weatherData: WeatherData | null;
  isLoading: boolean;
  lastFetch: number | null;
  onboardingComplete: boolean;
  currentPage: 'home' | 'week' | 'profiles' | 'settings';
  setActiveProfile: (id: string) => void;
  updateProfile: (id: string, thresholds: Partial<ProfileThresholds>) => void;
  setWeatherData: (data: WeatherData) => void;
  setIsLoading: (loading: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setCurrentPage: (page: 'home' | 'week' | 'profiles' | 'settings') => void;
  getActiveProfile: () => Profile;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeProfileId: 'me',
      profiles: [defaultProfileMe, defaultProfileFriends],
      weatherData: null,
      isLoading: false,
      lastFetch: null,
      onboardingComplete: false,
      currentPage: 'home',

      setActiveProfile: (id) => set({ activeProfileId: id }),

      updateProfile: (id, thresholds) =>
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, thresholds: { ...p.thresholds, ...thresholds } } : p
          ),
        })),

      setWeatherData: (data) => set({ weatherData: data, lastFetch: Date.now() }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
      setCurrentPage: (page) => set({ currentPage: page }),

      getActiveProfile: () => {
        const state = get();
        return state.profiles.find((p) => p.id === state.activeProfileId) || state.profiles[0];
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

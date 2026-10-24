import { useEffect } from 'react';
import { useStore } from '../store';
import { NowSection } from '../components/widgets/NowSection';
import { DecisionBar, GoldenWindowCard, DecisionCards } from '../components/widgets/DecisionWidgets';
import {
  NowcastCard,
  ShockCard,
  AlertsSection,
  ActivityScores,
  DaylightCard,
  CarWashCard,
  PressureCard,
  NightSkyCard,
} from '../components/widgets/InfoWidgets';
import { Skeleton } from '../components/ui';

export function HomeScreen() {
  const { weatherData, decision, isLoading, fetchAndEvaluate, getActiveProfile } = useStore();
  const profile = getActiveProfile();

  useEffect(() => {
    fetchAndEvaluate();
  }, []);

  useEffect(() => {
    if (weatherData) {
      fetchAndEvaluate();
    }
  }, [profile.id]);

  if (isLoading || !weatherData || !decision) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-0 animate-fade-in">
      {/* ۶.۱ بخش "الان" */}
      <NowSection />

      {/* ۶.۲ نوار تصمیم */}
      <DecisionBar />

      {/* ۶.۳ پنجره طلایی */}
      <GoldenWindowCard />

      {/* ۶.۴ سه کارت تصمیم */}
      <DecisionCards />

      {/* ۶.۵ Nowcast */}
      <NowcastCard />

      {/* ۶.۶ شوک دمایی */}
      <ShockCard />

      {/* ۶.۷ هشدارها */}
      <AlertsSection />

      {/* ۶.۸ امتیاز فعالیت‌ها */}
      <ActivityScores />

      {/* ویجت‌های اضافی */}
      <DaylightCard />
      <CarWashCard />
      <PressureCard />
      <NightSkyCard />
    </div>
  );
}

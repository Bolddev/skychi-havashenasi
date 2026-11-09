import { useStore } from './store';
import { Calendar, CloudRain, TrendingDown, Car } from 'lucide-react';

export function WeekPage() {
  const { weatherData, decision, getActiveProfile } = useStore();
  const profile = getActiveProfile();

  if (!weatherData) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center">
          <p className="text-text-secondary">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  const days = weatherData.daily;

  // Daily summaries
  const dailySummaries = days.map((day) => {
    const dayHours = weatherData.hourly.filter((h) => {
      const hDate = h.time.toISOString().split('T')[0];
      const dDate = day.date.toISOString().split('T')[0];
      return hDate === dDate && h.hour >= 10 && h.hour <= 22;
    });

    let maxTemp = -100;
    let minTemp = 100;
    let maxPrecip = 0;

    for (const h of dayHours) {
      if (h.temperature > maxTemp) maxTemp = h.temperature;
      if (h.temperature < minTemp) minTemp = h.temperature;
      if (h.precipitationProbability > maxPrecip) maxPrecip = h.precipitationProbability;
    }

    return {
      date: day.date,
      label: day.label || getDayName(day.date),
      maxTemp: Math.round(maxTemp),
      minTemp: Math.round(minTemp),
      maxPrecip,
    };
  });

  // Car wash
  let carWashAdvice: { day: string; advice: string }[] = [];
  if (profile.hasCar) {
    for (let d = 0; d < Math.min(3, days.length); d++) {
      const dayHours = weatherData.hourly.filter((h) => {
        const hDate = h.time.toISOString().split('T')[0];
        const dDate = days[d].date.toISOString().split('T')[0];
        return hDate === dDate;
      });
      let rainChance = 0;
      for (const h of dayHours) {
        if (h.precipitationProbability > rainChance) rainChance = h.precipitationProbability;
      }
      carWashAdvice.push({
        day: days[d].label || getDayName(days[d].date),
        advice: rainChance > 40 ? `باران ${rainChance}% - نشور` : rainChance > 20 ? `احتمال ${rainChance}% - احتیاط` : 'مناسب',
      });
    }
  }

  return (
    <div className="pb-24 space-y-4 animate-fade-in">
      <div className="px-1">
        <h1 className="text-2xl font-semibold text-text-primary">پیش‌بینی هفته</h1>
        <p className="text-sm text-text-secondary">قرچک، تهران</p>
      </div>

      {/* 7-Day Forecast */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">روند ۷ روزه</h3>
        <div className="space-y-3">
          {dailySummaries.map((day, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-16 text-sm font-medium">{day.label}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-blue-500 tabular-nums">{day.minTemp}°</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className="absolute h-full rounded-full bg-gradient-to-l from-orange-300 to-blue-300"
                      style={{
                        left: `${Math.max(0, (day.minTemp + 5) / 50 * 100)}%`,
                        right: `${Math.max(0, 100 - (day.maxTemp + 5) / 50 * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-red-500 tabular-nums">{day.maxTemp}°</span>
                </div>
                {day.maxPrecip > 0 && (
                  <span className="text-xs text-blue-400 flex items-center gap-0.5">
                    <CloudRain size={10} /> {day.maxPrecip}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Temperature Trend */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown size={18} className="text-accent" />
          <h3 className="text-sm font-medium">روند دما</h3>
        </div>
        <div className="flex items-end gap-1 h-24">
          {dailySummaries.map((day, i) => {
            const height = Math.max(10, ((day.maxTemp + 5) / 50) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-accent/40 to-accent/80 transition-all"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-text-secondary">{day.label.substring(0, 5)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Car Wash */}
      {carWashAdvice.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Car size={18} className="text-accent" />
            <h3 className="text-sm font-medium">برنامه‌ریز کارواش</h3>
          </div>
          <div className="space-y-2">
            {carWashAdvice.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/30">
                <span className="text-sm font-medium">{c.day}</span>
                <span className={`text-xs font-medium ${
                  c.advice.includes('نشور') ? 'text-danger' :
                  c.advice.includes('احتیاط') ? 'text-warning' : 'text-success'
                }`}>
                  {c.advice}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getDayName(date: Date): string {
  const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
  const jsDay = date.getDay();
  return days[jsDay];
}

import { useStore } from './store';
import { getWeeklyBestDay, getDayName, calculateHourlyRisk } from './rules';
import { Calendar, CloudRain, TrendingDown, Car } from 'lucide-react';

export function WeekPage() {
  const { weatherData, getActiveProfile } = useStore();
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

  const bestDay = getWeeklyBestDay(weatherData, profile);
  const days = weatherData.daily.time;

  // Get daily summary data
  const dailySummaries = days.map((day, dIdx) => {
    let totalRisk = 0;
    let count = 0;
    let maxTemp = -100;
    let minTemp = 100;
    let maxPrecip = 0;

    for (let i = dIdx * 24; i < (dIdx + 1) * 24 && i < weatherData.hourly.time.length; i++) {
      const hour = parseInt(weatherData.hourly.time[i].split('T')[1]?.substring(0, 2) || '0');
      if (hour >= 10 && hour <= 22) {
        const risk = calculateHourlyRisk(profile, weatherData, i);
        totalRisk += risk.riskScore;
        count++;
      }
      const temp = weatherData.hourly.temperature_2m[i];
      if (temp > maxTemp) maxTemp = temp;
      if (temp < minTemp) minTemp = temp;
      const precip = weatherData.hourly.precipitation_probability[i] || 0;
      if (precip > maxPrecip) maxPrecip = precip;
    }

    return {
      date: day,
      dayName: getDayName(day),
      avgRisk: count > 0 ? Math.round(totalRisk / count) : 50,
      maxTemp: Math.round(maxTemp),
      minTemp: Math.round(minTemp),
      maxPrecip,
    };
  });

  // Car wash for the week
  let carWashAdvice: { day: string; advice: string }[] = [];
  if (profile.thresholds.hasCar) {
    for (let d = 0; d < Math.min(3, days.length); d++) {
      let rainChance = 0;
      for (let i = d * 24; i < (d + 1) * 24 && i < weatherData.hourly.time.length; i++) {
        const p = weatherData.hourly.precipitation_probability[i] || 0;
        if (p > rainChance) rainChance = p;
      }
      carWashAdvice.push({
        day: getDayName(days[d]),
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

      {/* Best Day */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={18} className="text-accent" />
          <h3 className="text-sm font-medium">بهترین روز هفته</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{getDayName(bestDay.day)}</div>
            <div className="text-xs text-text-secondary">{bestDay.day}</div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            bestDay.risk < 30 ? 'bg-success/10 text-success' :
            bestDay.risk < 60 ? 'bg-warning/10 text-warning' :
            'bg-danger/10 text-danger'
          }`}>
            خطر: {bestDay.risk}
          </div>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">روند ۷ روزه</h3>
        <div className="space-y-3">
          {dailySummaries.map((day) => (
            <div key={day.date} className="flex items-center gap-3">
              <div className="w-16 text-sm font-medium">{day.dayName}</div>
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
                <div className="flex items-center gap-2">
                  <div className={`flex-1 h-1.5 rounded-full ${
                    day.avgRisk < 30 ? 'bg-success' : day.avgRisk < 60 ? 'bg-warning' : 'bg-danger'
                  }`} style={{ width: `${day.avgRisk}%` }} />
                  {day.maxPrecip > 0 && (
                    <span className="text-xs text-blue-400 flex items-center gap-0.5">
                      <CloudRain size={10} /> {day.maxPrecip}%
                    </span>
                  )}
                </div>
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
          {dailySummaries.map((day) => {
            const maxH = 40;
            const minH = -5;
            const range = maxH - minH;
            const height = ((day.maxTemp - minH) / range) * 100;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-accent/40 to-accent/80 transition-all"
                  style={{ height: `${Math.max(10, height)}%` }}
                />
                <span className="text-[10px] text-text-secondary">{day.dayName.substring(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Car Wash Planner */}
      {carWashAdvice.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Car size={18} className="text-accent" />
            <h3 className="text-sm font-medium">برنامه‌ریز کارواش</h3>
          </div>
          <div className="space-y-2">
            {carWashAdvice.map((c) => (
              <div key={c.day} className="flex items-center justify-between p-2 rounded-lg bg-white/30">
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

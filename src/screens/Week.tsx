import { useStore } from '../store';
import { GlassCard, Badge, WeatherIcon, Skeleton } from '../components/ui';
import { Calendar, CloudRain, TrendingDown, Car, Trophy } from 'lucide-react';

export function WeekPage() {
  const { weatherData, decision, getActiveProfile } = useStore();
  const profile = getActiveProfile();

  if (!weatherData || !decision) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const { weekRanking, weeklyTrend, weekPattern, carWash } = decision;
  const days = weatherData.daily;

  const toPersian = (n: number) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(Math.round(n)).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
  };

  return (
    <div className="pb-24 space-y-4 animate-fade-in">
      <div className="px-1">
        <h1 className="text-2xl font-semibold text-text-primary">پیش‌بینی هفته</h1>
        <p className="text-sm text-text-secondary">قرچک، تهران</p>
      </div>

      {/* BestDayCard */}
      {weekRanking && weekRanking.length > 0 && (
        <GlassCard level={2} className="border-2 border-accent/30">
          <div className="flex items-center gap-3 mb-3">
            <Trophy size={24} className="text-accent" />
            <div>
              <h3 className="text-sm font-medium text-text-secondary">بهترین روز هفته</h3>
              <p className="text-lg font-bold">{weekRanking[0].label || 'نامشخص'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <WeatherIcon code={days[0]?.weatherCode || 0} size="lg" />
            <div className="text-left">
              <div className="text-2xl font-bold tabular-nums">
                {toPersian(days[0]?.tempMin || 0)}° – {toPersian(days[0]?.tempMax || 0)}°
              </div>
            </div>
          </div>
          {weekRanking[0].reasons.length > 0 && (
            <p className="text-xs text-text-secondary">{weekRanking[0].reasons[0]}</p>
          )}
        </GlassCard>
      )}

      {/* WeeklyTrend */}
      {weeklyTrend && (
        <GlassCard level={2}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-accent" />
            <h3 className="text-sm font-medium">روند هفتگی</h3>
          </div>
          <p className="text-sm">{weeklyTrend}</p>
        </GlassCard>
      )}

      {/* DayCards */}
      <div className="space-y-3">
        {days.map((day, i) => {
          const ranking = weekRanking?.[i];
          const isFirst = i === 0;
          const medal = i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

          return (
            <GlassCard key={i} level={2} className={isFirst ? 'border-2 border-accent/20' : ''}>
              <div className="flex items-center gap-3">
                {/* نام روز */}
                <div className="w-20">
                  <div className="flex items-center gap-1">
                    {medal && <span>{medal}</span>}
                    <span className="text-sm font-medium">{day.label || 'نامشخص'}</span>
                  </div>
                </div>

                {/* آیکون و دما */}
                <div className="flex-1 flex items-center gap-3">
                  <WeatherIcon code={day.weatherCode} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-blue-500 tabular-nums">{toPersian(day.tempMin)}°</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                        <div
                          className="absolute h-full rounded-full bg-gradient-to-l from-orange-300 to-blue-300"
                          style={{
                            left: `${Math.max(0, (day.tempMin + 5) / 50 * 100)}%`,
                            right: `${Math.max(0, 100 - (day.tempMax + 5) / 50 * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-red-500 tabular-nums">{toPersian(day.tempMax)}°</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      {day.precipitationProbabilityMax > 0 && (
                        <span className="flex items-center gap-0.5">
                          <CloudRain size={10} /> {toPersian(day.precipitationProbabilityMax)}%
                        </span>
                      )}
                      <span>💨 {toPersian(day.windGustsMax)} km/h</span>
                    </div>
                  </div>
                </div>

                {/* بج وضعیت */}
                {ranking && (
                  <Badge variant={
                    ranking.status === 'good' ? 'success' :
                    ranking.status === 'caution' ? 'warning' : 'danger'
                  }>
                    {ranking.status === 'good' ? 'مناسب' :
                     ranking.status === 'caution' ? 'احتیاط' : 'نامناسب'}
                  </Badge>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* WeekPattern */}
      {weekPattern && (
        <GlassCard level={2}>
          <h3 className="text-sm font-medium text-text-secondary mb-2">📊 الگوی هفته</h3>
          <p className="text-sm">{weekPattern}</p>
        </GlassCard>
      )}

      {/* CarWashCard */}
      {carWash && (
        <GlassCard level={2}>
          <div className="flex items-center gap-2 mb-2">
            <Car size={18} className="text-accent" />
            <h3 className="text-sm font-medium">برنامه‌ریز کارواش</h3>
          </div>
          <p className="text-sm">
            {carWash.recommendation === 'wash' && <span className="text-success font-medium">✅ {carWash.reason}</span>}
            {carWash.recommendation === 'dont-wash' && <span className="text-warning font-medium">⏳ {carWash.reason}</span>}
            {carWash.recommendation === 'covered-parking' && <span className="text-text-secondary font-medium">🅿️ {carWash.reason}</span>}
          </p>
          {carWash.parkingAdvice && (
            <p className="text-xs text-text-secondary mt-1">{carWash.parkingAdvice}</p>
          )}
        </GlassCard>
      )}
    </div>
  );
}

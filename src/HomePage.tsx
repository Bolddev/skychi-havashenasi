import { useEffect, useState } from 'react';
import { useStore } from './store';
import { fetchWeatherData, fetchAirQuality, getCurrentHourIndex, formatHour } from './weather';
import { calculateDecision, calculateHourlyRisk, getDayName, getActivityEmoji } from './rules';
import { Cloud, CloudRain, Sun, Wind, Thermometer, AlertTriangle, Droplets, Car, MapPin } from 'lucide-react';

export function HomePage() {
  const { weatherData, setWeatherData, isLoading, setIsLoading, getActiveProfile, lastFetch } = useStore();
  const [airQuality, setAirQuality] = useState<{ pm2_5: number; pm10: number; us_aqi: number } | null>(null);
  const profile = getActiveProfile();

  useEffect(() => {
    const loadData = async () => {
      if (lastFetch && Date.now() - lastFetch < 15 * 60 * 1000 && weatherData) return;
      setIsLoading(true);
      try {
        const data = await fetchWeatherData();
        setWeatherData(data);
        const aq = await fetchAirQuality();
        setAirQuality(aq);
      } catch (e) {
        console.error('Failed to fetch weather:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading || !weatherData) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center">
          <div className="animate-pulse-soft text-4xl mb-4">🌤️</div>
          <p className="text-text-secondary">در حال دریافت اطلاعات هوا...</p>
          <p className="text-sm text-text-secondary mt-2">قرچک، تهران</p>
        </div>
      </div>
    );
  }

  const decision = calculateDecision(profile, weatherData);
  const currentIdx = getCurrentHourIndex(weatherData.hourly.time);
  const currentTemp = weatherData.hourly.apparent_temperature[currentIdx] || 0;
  const currentActualTemp = weatherData.hourly.temperature_2m[currentIdx] || 0;
  const currentHumidity = weatherData.hourly.relative_humidity_2m[currentIdx] || 0;
  const currentWind = weatherData.hourly.wind_speed_10m[currentIdx] || 0;
  const currentGusts = weatherData.hourly.wind_gusts_10m[currentIdx] || 0;

  // Afternoon hours for decision bar
  const afternoonHours: { hour: string; risk: number; level: string }[] = [];
  for (let i = currentIdx; i < weatherData.hourly.time.length && i < currentIdx + 24; i++) {
    const timeStr = weatherData.hourly.time[i];
    const hour = parseInt(timeStr.split('T')[1]?.substring(0, 2) || '0');
    if (hour >= 16 && hour <= 22) {
      const risk = calculateHourlyRisk(profile, weatherData, i);
      afternoonHours.push({ hour: formatHour(timeStr), risk: risk.riskScore, level: risk.level });
    }
  }

  return (
    <div className="pb-24 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">هویار</h1>
          <div className="flex items-center gap-1 text-text-secondary text-sm">
            <MapPin size={14} />
            <span>قرچک، تهران</span>
          </div>
        </div>
        <div className="glass-card px-3 py-2 text-center">
          <div className="text-2xl font-semibold tabular-nums">{Math.round(currentActualTemp)}°</div>
          <div className="text-xs text-text-secondary">احساسی {Math.round(currentTemp)}°</div>
        </div>
      </div>

      {/* Widget 1: Decision Bar */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">نوار تصمیم امروز (۱۶-۲۲)</h3>
        <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
          {afternoonHours.map((h, i) => (
            <div
              key={i}
              className={`flex-1 flex items-center justify-center text-xs font-medium text-white transition-all ${
                h.level === 'green' ? 'risk-green' : h.level === 'yellow' ? 'risk-yellow' : 'risk-red'
              }`}
              title={`${h.hour} - خطر: ${h.risk}`}
            >
              <span className="hidden sm:inline">{h.hour}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-text-secondary">
          <span>۱۶:۰۰</span>
          <span>۲۲:۰۰</span>
        </div>
        
        {decision.goldenWindow && (
          <div className="mt-3 p-3 bg-success/10 rounded-xl border border-success/20">
            <div className="flex items-center gap-2">
              <Sun size={18} className="text-success" />
              <span className="font-medium text-success">
                پنجره طلایی: {decision.goldenWindow.start} – {decision.goldenWindow.end}
              </span>
            </div>
          </div>
        )}

        {decision.thermalShock.warning && (
          <div className="mt-3 p-3 bg-danger/10 rounded-xl border border-danger/20">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-danger" />
              <span className="font-medium text-danger">
                شوک دمایی: {decision.thermalShock.diff > 0 ? '+' : ''}{decision.thermalShock.diff}° نسبت به دیروز
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Widget 2: Three Decision Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`glass-card p-3 text-center ${
          decision.goOut === 'go' ? 'border-success/30' :
          decision.goOut === 'caution' ? 'border-warning/30' : 'border-danger/30'
        }`}>
          <div className="text-2xl mb-1">
            {decision.goOut === 'go' ? '✅' : decision.goOut === 'caution' ? '⚠️' : '🚫'}
          </div>
          <div className="text-xs font-medium">
            {decision.goOut === 'go' ? 'برو!' : decision.goOut === 'caution' ? 'با احتیاط' : 'نرو'}
          </div>
        </div>

        <div className="glass-card p-3 text-center">
          <div className="text-2xl mb-1">👕</div>
          <div className="text-xs font-medium leading-tight">{decision.clothing}</div>
        </div>

        <div className="glass-card p-3 text-center">
          <div className="text-2xl mb-1">🎒</div>
          <div className="text-xs font-medium leading-tight">
            {decision.equipment.length > 0 ? decision.equipment.join(' + ') : 'تجهیز خاصی لازم نیست'}
          </div>
        </div>
      </div>

      {/* Widget 3: Rain Nowcast */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <CloudRain size={18} className="text-accent" />
          <h3 className="text-sm font-medium">وضعیت بارش الان</h3>
        </div>
        {decision.rainNowcast.raining ? (
          <p className="text-sm text-danger font-medium">الان باران می‌بارد! ☔</p>
        ) : decision.rainNowcast.startsIn !== null ? (
          <p className="text-sm">
            <span className="text-warning font-medium">باران {decision.rainNowcast.startsIn} دقیقه دیگر شروع می‌شود</span>
            {decision.rainNowcast.duration && ` و ${decision.rainNowcast.duration} دقیقه طول می‌کشد`}
          </p>
        ) : (
          <p className="text-sm text-success">بارشی در ساعات نزدیک پیش‌بینی نمی‌شود ✨</p>
        )}
      </div>

      {/* Widget 4: Day/Night Bar */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sun size={18} className="text-warning" />
          <h3 className="text-sm font-medium">نوار روز/شب</h3>
        </div>
        <div className="flex rounded-lg overflow-hidden h-6">
          <div className="flex-1 bg-gradient-to-l from-amber-200 to-amber-100 flex items-center justify-center text-xs">
            روز
          </div>
          <div className="w-12 bg-gradient-to-l from-orange-300 to-amber-200 flex items-center justify-center text-xs">
            🌅
          </div>
          <div className="flex-1 bg-gradient-to-l from-indigo-900 to-indigo-700 flex items-center justify-center text-xs text-white">
            شب
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-secondary tabular-nums">
          <span>روز: ۱۶:۰۰–{decision.dayNightInfo.twilight}</span>
          <span>شب: {decision.dayNightInfo.nightStart}–۲۲:۰۰</span>
        </div>
      </div>

      {/* Widget 5: Activity Scores */}
      {decision.activityScores.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">امتیاز فعالیت‌ها</h3>
          <div className="space-y-2">
            {decision.activityScores.map((a) => (
              <div key={a.activity} className="flex items-center justify-between p-2 rounded-lg bg-white/30">
                <div className="flex items-center gap-2">
                  <span>{getActivityEmoji(a.activity)}</span>
                  <span className="text-sm">
                    {a.activity === 'picnic' ? 'پیک‌نیک' :
                     a.activity === 'park' ? 'پارک' :
                     a.activity === 'walk' ? 'پیاده‌روی' :
                     a.activity === 'shopping' ? 'خرید' :
                     a.activity === 'photography' ? 'عکاسی' :
                     a.activity === 'exercise' ? 'ورزش' : a.activity}
                  </span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  a.score === 'good' ? 'bg-success/10 text-success' :
                  a.score === 'caution' ? 'bg-warning/10 text-warning' :
                  'bg-danger/10 text-danger'
                }`}>
                  {a.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Widget 6: Car Wash Planner */}
      {decision.carWash && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Car size={18} className="text-accent" />
            <h3 className="text-sm font-medium">برنامه‌ریز کارواش</h3>
          </div>
          <p className="text-sm">
            {decision.carWash === 'wash' && <span className="text-success font-medium">✅ امروز بشور! ۷۲ ساعت بارش نداریم.</span>}
            {decision.carWash === 'wait' && <span className="text-warning font-medium">⏳ امروز نشور. باران نزدیک است.</span>}
            {decision.carWash === 'covered' && <span className="text-text-secondary font-medium">🅿️ زیر سقف ببر، باران ممکنه بیاد.</span>}
          </p>
        </div>
      )}

      {/* Current Conditions */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">شرایط فعلی</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Thermometer size={16} className="text-danger" />
            <div>
              <div className="text-xs text-text-secondary">دما</div>
              <div className="text-sm font-medium tabular-nums">{Math.round(currentActualTemp)}° / احساسی {Math.round(currentTemp)}°</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-blue-400" />
            <div>
              <div className="text-xs text-text-secondary">رطوبت</div>
              <div className="text-sm font-medium tabular-nums">{currentHumidity}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind size={16} className="text-teal-500" />
            <div>
              <div className="text-xs text-text-secondary">باد</div>
              <div className="text-sm font-medium tabular-nums">{Math.round(currentWind)} km/h</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Cloud size={16} className="text-gray-400" />
            <div>
              <div className="text-xs text-text-secondary">وزش باد</div>
              <div className="text-sm font-medium tabular-nums">{Math.round(currentGusts)} km/h</div>
            </div>
          </div>
        </div>
      </div>

      {/* Air Quality */}
      {airQuality && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">کیفیت هوا</h3>
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-bold tabular-nums ${
              airQuality.us_aqi <= 50 ? 'text-success' :
              airQuality.us_aqi <= 100 ? 'text-warning' : 'text-danger'
            }`}>
              {airQuality.us_aqi}
            </div>
            <div>
              <div className="text-sm font-medium">
                {airQuality.us_aqi <= 50 ? 'پاک' :
                 airQuality.us_aqi <= 100 ? 'متوسط' :
                 airQuality.us_aqi <= 150 ? 'ناسالم برای حساس‌ها' : 'ناسالم'}
              </div>
              <div className="text-xs text-text-secondary">
                PM2.5: {airQuality.pm2_5} | PM10: {airQuality.pm10}
              </div>
            </div>
          </div>
          {airQuality.us_aqi > 100 && profile.thresholds.hasAllergy && (
            <div className="mt-2 p-2 bg-warning/10 rounded-lg text-xs text-warning">
              ⚠️ با توجه به آلرژی شما، ماسک بزنید.
            </div>
          )}
        </div>
      )}

      {/* Hourly Risk Details */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">جزئیات ساعتی</h3>
        <div className="space-y-2">
          {afternoonHours.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-medium w-12 tabular-nums">{h.hour}</span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    h.level === 'green' ? 'risk-green' : h.level === 'yellow' ? 'risk-yellow' : 'risk-red'
                  }`}
                  style={{ width: `${h.risk}%` }}
                />
              </div>
              <span className="text-xs tabular-nums w-8 text-left">{h.risk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

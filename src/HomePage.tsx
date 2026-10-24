import { useEffect, useState } from 'react';
import { useStore } from './store';
import { ExportModal } from './ExportModal';
import { Cloud, CloudRain, Sun, Wind, Thermometer, AlertTriangle, Droplets, Car, MapPin, Share2, Moon, Gauge, Clock } from 'lucide-react';

export function HomePage() {
  const { weatherData, decision, isLoading, fetchAndEvaluate, getActiveProfile } = useStore();
  const [showExport, setShowExport] = useState(false);
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
      <div className="min-h-screen bg-app flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center">
          <div className="animate-pulse-soft text-4xl mb-4">🌤️</div>
          <p className="text-text-secondary">در حال دریافت اطلاعات هوا...</p>
          <p className="text-sm text-text-secondary mt-2">قرچک، تهران</p>
        </div>
      </div>
    );
  }

  const { current, hourlyRisk, goldenWindow, goDecision, goldenWindowReason, nowcast, temperatureShock, wearAdvice, gearAdvice, activityScores, carWash, daylightInfo, alerts, nightSky, pressure, departureSuggestion } = decision;

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const toPersian = (n: number) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(Math.round(n)).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
  };

  const getRiskColor = (label: string) => {
    switch (label) {
      case 'safe': return 'risk-green';
      case 'caution': return 'risk-yellow';
      case 'danger': return 'risk-red';
      default: return 'bg-gray-300';
    }
  };

  const getRiskEmoji = (label: string) => {
    switch (label) {
      case 'safe': return '🟢';
      case 'caution': return '🟡';
      case 'danger': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="pb-24 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">اسکایچی</h1>
          <div className="flex items-center gap-1 text-text-secondary text-sm">
            <MapPin size={14} />
            <span>قرچک، تهران</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExport(true)}
            className="glass-card p-2.5 hover:bg-white/80 transition-all"
            title="خروجی اطلاعات"
          >
            <Share2 size={18} className="text-accent" />
          </button>
          <div className="glass-card px-3 py-2 text-center">
            <div className="text-2xl font-semibold tabular-nums">{toPersian(current.temperature)}°</div>
            <div className="text-xs text-text-secondary">احساسی {toPersian(current.apparentTemperature)}°</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`glass-card p-3 border-2 ${
              alert.severity === 'danger' ? 'border-danger/50 bg-danger/5' :
              alert.severity === 'warning' ? 'border-warning/50 bg-warning/5' :
              'border-blue-300/50 bg-blue-50/50'
            }`}>
              <div className="flex items-start gap-2">
                <span className="text-xl">{alert.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Widget 1: Decision Bar */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">نوار تصمیم امروز (۱۶-۲۲)</h3>
        <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
          {hourlyRisk.map((h, i) => (
            <div
              key={i}
              className={`flex-1 flex items-center justify-center text-xs font-medium text-white transition-all ${getRiskColor(h.label)}`}
              title={`${h.hour}:00 — خطر: ${h.risk}`}
            >
              <span className="hidden sm:inline">{h.hour}:00</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-text-secondary">
          <span>۱۶:۰۰</span>
          <span>۲۲:۰۰</span>
        </div>
        
        {goldenWindow && (
          <div className="mt-3 p-3 bg-success/10 rounded-xl border border-success/20">
            <div className="flex items-center gap-2">
              <Sun size={18} className="text-success" />
              <span className="font-medium text-success">
                پنجره طلایی: {formatTime(goldenWindow.start)} – {formatTime(goldenWindow.end)}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">{goldenWindowReason}</p>
          </div>
        )}
      </div>

      {/* Widget 2: Go Decision */}
      <div className={`glass-card p-4 border-2 ${
        goDecision.action === 'go' ? 'border-success/30' :
        goDecision.action === 'go-until' ? 'border-warning/30' :
        goDecision.action === 'go-covered' ? 'border-blue-300/30' :
        'border-danger/30'
      }`}>
        <div className="text-center mb-2">
          <div className="text-3xl mb-1">
            {goDecision.action === 'go' ? '✅' :
             goDecision.action === 'go-until' ? '⏰' :
             goDecision.action === 'go-covered' ? '☂️' : '🚫'}
          </div>
          <p className="text-sm font-medium">{goDecision.message}</p>
        </div>
        {goDecision.until && (
          <p className="text-xs text-text-secondary text-center">
            تا ساعت {formatTime(goDecision.until)}
          </p>
        )}
      </div>

      {/* Nowcast */}
      {nowcast && nowcast.status !== 'no-data' && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CloudRain size={18} className="text-accent" />
            <h3 className="text-sm font-medium">وضعیت بارش لحظه‌ای</h3>
          </div>
          <p className="text-sm">{nowcast.message}</p>
        </div>
      )}

      {/* Temperature Shock */}
      {temperatureShock && (
        <div className="glass-card p-4 border-2 border-danger/30 bg-danger/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-danger" />
            <h3 className="text-sm font-medium text-danger">شوک دمایی</h3>
          </div>
          <p className="text-sm font-medium">{temperatureShock.message}</p>
        </div>
      )}

      {/* Wear & Gear Advice */}
      {wearAdvice && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-2">👕 پوشش پیشنهادی</h3>
          <p className="text-sm">{wearAdvice.summary}</p>
        </div>
      )}

      {gearAdvice && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-2">🎒 تجهیزات پیشنهادی</h3>
          <p className="text-sm">{gearAdvice.summary}</p>
        </div>
      )}

      {/* Activity Scores */}
      {activityScores && activityScores.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">امتیاز فعالیت‌ها</h3>
          <div className="space-y-2">
            {activityScores.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/30">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {a.activity === 'picnic' ? '🧺' :
                     a.activity === 'park' ? '🌳' :
                     a.activity === 'walking' ? '🚶' :
                     a.activity === 'shopping' ? '🛍️' :
                     a.activity === 'sports' ? '🏃' :
                     a.activity === 'photography' ? '📷' : '✨'}
                  </span>
                  <span className="text-sm">
                    {a.activity === 'picnic' ? 'پیک‌نیک' :
                     a.activity === 'park' ? 'پارک' :
                     a.activity === 'walking' ? 'پیاده‌روی' :
                     a.activity === 'shopping' ? 'خرید' :
                     a.activity === 'sports' ? 'ورزش' :
                     a.activity === 'photography' ? 'عکاسی' : a.activity}
                  </span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  a.status === 'good' ? 'bg-success/10 text-success' :
                  a.status === 'caution' ? 'bg-warning/10 text-warning' :
                  'bg-danger/10 text-danger'
                }`}>
                  {a.status === 'good' ? 'مناسب' : a.status === 'caution' ? 'با احتیاط' : 'نامناسب'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Car Wash */}
      {carWash && (
        <div className="glass-card p-4">
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
        </div>
      )}

      {/* Daylight Info */}
      {daylightInfo && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sun size={18} className="text-warning" />
            <h3 className="text-sm font-medium">اطلاعات خورشید</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>🌄 طلوع: {formatTime(daylightInfo.sunrise)}</div>
            <div>🌇 غروب: {formatTime(daylightInfo.sunset)}</div>
            <div>🌆 گرگ‌ومیش: {formatTime(daylightInfo.civilTwilightEnd)}</div>
            <div>📸 ساعت طلایی: {formatTime(daylightInfo.goldenHourEvening.start)}</div>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            {daylightInfo.isDay ? (
              <span>☀️ روز ({daylightInfo.timeUntilSunset ? toPersian(Math.round(daylightInfo.timeUntilSunset / 60)) : '—'} ساعت تا غروب)</span>
            ) : (
              <span>🌙 شب ({daylightInfo.timeUntilSunrise ? toPersian(Math.round(daylightInfo.timeUntilSunrise / 60)) : '—'} ساعت تا طلوع)</span>
            )}
          </p>
        </div>
      )}

      {/* Departure Suggestion */}
      {departureSuggestion && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-accent" />
            <h3 className="text-sm font-medium">زمان حرکت</h3>
          </div>
          <p className="text-sm">{departureSuggestion.message}</p>
        </div>
      )}

      {/* Pressure */}
      {pressure && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge size={18} className="text-accent" />
            <h3 className="text-sm font-medium">فشار هوا</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold tabular-nums">{toPersian(Math.round(pressure.value))} hPa</span>
            <span className={`text-sm font-medium ${
              pressure.trend === 'rising' ? 'text-success' :
              pressure.trend === 'falling' ? 'text-warning' :
              'text-text-secondary'
            }`}>
              {pressure.label}
            </span>
          </div>
        </div>
      )}

      {/* Night Sky */}
      {nightSky && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Moon size={18} className="text-indigo-400" />
            <h3 className="text-sm font-medium">آسمان شب</h3>
          </div>
          <p className="text-sm">{nightSky.message}</p>
          <p className="text-xs text-text-secondary mt-1">
            فاز ماه: {toPersian(Math.round(nightSky.moonIllumination))}٪ روشنایی
          </p>
        </div>
      )}

      {/* Widget: Hourly Risk Details with Breakdown */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">جزئیات ساعتی با Breakdown</h3>
        <div className="space-y-3">
          {hourlyRisk.map((h, i) => (
            <div key={i} className="p-2 rounded-lg bg-white/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{getRiskEmoji(h.label)} {h.hour}:00</span>
                <span className="text-sm font-bold tabular-nums">
                  {h.risk !== null ? toPersian(h.risk) : '—'}
                </span>
              </div>
              {h.risk !== null && (
                <div className="grid grid-cols-3 gap-1 text-[10px] text-text-secondary">
                  <span>🌡️ {h.breakdown.cold.detail}</span>
                  <span>🌧️ {h.breakdown.rain.detail}</span>
                  <span>💨 {h.breakdown.wind.detail}</span>
                </div>
              )}
              {h.advice.length > 0 && (
                <div className="mt-1 text-xs text-accent">
                  📌 {h.advice.join('، ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Widget: Current Conditions */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">شرایط فعلی</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Thermometer size={16} className="text-danger" />
            <div>
              <div className="text-xs text-text-secondary">دما</div>
              <div className="text-sm font-medium tabular-nums">{toPersian(current.temperature)}° / احساسی {toPersian(current.apparentTemperature)}°</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-blue-400" />
            <div>
              <div className="text-xs text-text-secondary">رطوبت</div>
              <div className="text-sm font-medium tabular-nums">{toPersian(current.humidity)}% ({current.humidityLabel})</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind size={16} className="text-teal-500" />
            <div>
              <div className="text-xs text-text-secondary">باد</div>
              <div className="text-sm font-medium tabular-nums">{toPersian(current.windSpeed)} km/h ({current.windDirectionLabel})</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Cloud size={16} className="text-gray-400" />
            <div>
              <div className="text-xs text-text-secondary">وزش باد</div>
              <div className="text-sm font-medium tabular-nums">{toPersian(current.windGusts)} km/h ({current.windGustLabel})</div>
            </div>
          </div>
        </div>
        <div className="mt-3 p-2 bg-white/30 rounded-lg">
          <p className="text-xs text-text-secondary">{current.summary}</p>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}

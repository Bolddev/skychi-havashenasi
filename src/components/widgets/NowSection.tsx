import { useStore } from '../../store';
import { GlassCard, WeatherIcon } from '../ui';
import { Wind, Droplets, Eye, Cloud } from 'lucide-react';

export function NowSection() {
  const { decision } = useStore();

  if (!decision) return null;

  const { current } = decision;

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const toPersian = (n: number) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(Math.round(n)).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
  };

  return (
    <GlassCard level={2} className="mb-4">
      {/* سطر اول: ساعت */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <WeatherIcon code={current.weatherCode} size="lg" />
          <div>
            <div className="text-sm text-text-secondary">الان — {formatTime(current.time)}</div>
            <div className="text-base font-medium">{current.weatherLabel}</div>
          </div>
        </div>
      </div>

      {/* سطر دوم: دما */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tabular-nums">{toPersian(current.temperature)}°</span>
          <span className="text-lg text-text-secondary tabular-nums">(احساسی {toPersian(current.apparentTemperature)}°)</span>
        </div>
        <p className="text-sm text-text-secondary mt-1">{current.temperatureInterpretation}</p>
      </div>

      {/* سطر سوم: وضعیت */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Cloud size={16} className="text-text-secondary" />
        <span>{current.cloudLabel} (ابر {toPersian(current.cloudCover)}٪)</span>
      </div>

      {/* سطر چهارم: شبکه ۲×۳ */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Wind size={16} className="text-teal-500" />
          <div className="text-sm">
            <div className="text-text-secondary text-xs">باد</div>
            <div className="font-medium tabular-nums">
              {toPersian(current.windSpeed)} km/h — {current.windGustLabel}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-blue-400" />
          <div className="text-sm">
            <div className="text-text-secondary text-xs">رطوبت</div>
            <div className="font-medium tabular-nums">
              {toPersian(current.humidity)}٪ — {current.humidityLabel}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-base">☀️</span>
          <div className="text-sm">
            <div className="text-text-secondary text-xs">UV</div>
            <div className="font-medium tabular-nums">
              {toPersian(current.uvIndex)} — {current.uvLabel}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-base">🌧️</span>
          <div className="text-sm">
            <div className="text-text-secondary text-xs">بارش</div>
            <div className="font-medium tabular-nums">
              {toPersian(current.precipitationProbability)}٪ — {current.precipitationLabel}
            </div>
          </div>
        </div>

        {current.visibility != null && (
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-text-secondary" />
            <div className="text-sm">
              <div className="text-text-secondary text-xs">دید</div>
              <div className="font-medium tabular-nums">
                {current.visibility >= 1000
                  ? `${toPersian(current.visibility / 1000)} km`
                  : `${toPersian(current.visibility)} m`}
                {' '}— {current.visibilityLabel}
              </div>
            </div>
          </div>
        )}

        {current.aqi != null && (
          <div className="flex items-center gap-2">
            <span className="text-base">🌫️</span>
            <div className="text-sm">
              <div className="text-text-secondary text-xs">AQI</div>
              <div className="font-medium tabular-nums">
                {toPersian(current.aqi)} — {current.aqiLabel}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* سطر آخر: خلاصه */}
      <div className="bg-accent-ghost rounded-xl p-3">
        <p className="text-sm font-medium text-accent">📌 {current.summary}</p>
      </div>
    </GlassCard>
  );
}

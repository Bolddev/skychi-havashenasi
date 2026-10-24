import { useState } from 'react';
import { useStore } from './store';
import { calculateDecision } from './rules';
import { Users, User, Settings, ChevronLeft } from 'lucide-react';
import { Onboarding } from './Onboarding';

export function ProfilesPage() {
  const { profiles, activeProfileId, setActiveProfile, weatherData, setCurrentPage } = useStore();
  const [editingProfile, setEditingProfile] = useState<string | null>(null);

  if (editingProfile) {
    return (
      <Onboarding
        editProfileId={editingProfile}
        onComplete={() => setEditingProfile(null)}
      />
    );
  }

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];
  const otherProfile = profiles.find((p) => p.id !== activeProfileId) || profiles[1];

  // Calculate golden windows for both profiles
  let activeWindow = '—';
  let otherWindow = '—';
  if (weatherData) {
    const activeDecision = calculateDecision(activeProfile, weatherData);
    const otherDecision = calculateDecision(otherProfile, weatherData);
    activeWindow = activeDecision.goldenWindow
      ? `${activeDecision.goldenWindow.start}–${activeDecision.goldenWindow.end}`
      : 'پنجره‌ای نیست';
    otherWindow = otherDecision.goldenWindow
      ? `${otherDecision.goldenWindow.start}–${otherDecision.goldenWindow.end}`
      : 'پنجره‌ای نیست';
  }

  return (
    <div className="pb-24 space-y-4 animate-fade-in">
      <div className="px-1">
        <h1 className="text-2xl font-semibold text-text-primary">پروفایل‌ها</h1>
        <p className="text-sm text-text-secondary">مدیریت پروفایل‌های مختلف</p>
      </div>

      {/* Active Profile Card */}
      <div className="glass-card p-4 border-2 border-accent/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User size={20} className="text-accent" />
            <h3 className="font-medium">{activeProfile.name}</h3>
          </div>
          <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">فعال</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">آستانه سرما:</span>
            <span className="font-medium tabular-nums">{activeProfile.thresholds.coldThreshold}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">حمل‌ونقل:</span>
            <span className="font-medium">
              {activeProfile.thresholds.transport === 'walk' ? '🚶 پیاده' :
               activeProfile.thresholds.transport === 'car' ? '🚗 ماشین' :
               activeProfile.thresholds.transport === 'bike' ? '🚲 دوچرخه' :
               activeProfile.thresholds.transport === 'motorcycle' ? '🏍️ موتور' : '🚌 عمومی'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">پنجره طلایی:</span>
            <span className="font-medium text-success">{activeWindow}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">ترجیح زمانی:</span>
            <span className="font-medium">
              {activeProfile.thresholds.timePreference === 'day' ? '☀️ روز' :
               activeProfile.thresholds.timePreference === 'night' ? '🌙 شب' : '🔄 فرقی نداره'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setEditingProfile(activeProfile.id)}
          className="mt-3 w-full btn-secondary text-sm flex items-center justify-center gap-1"
        >
          <Settings size={14} />
          ویرایش
        </button>
      </div>

      {/* Other Profile Card */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-text-secondary" />
            <h3 className="font-medium">{otherProfile.name}</h3>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">آستانه سرما:</span>
            <span className="font-medium tabular-nums">{otherProfile.thresholds.coldThreshold}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">حمل‌ونقل:</span>
            <span className="font-medium">
              {otherProfile.thresholds.transport === 'walk' ? '🚶 پیاده' :
               otherProfile.thresholds.transport === 'car' ? '🚗 ماشین' :
               otherProfile.thresholds.transport === 'bike' ? '🚲 دوچرخه' :
               otherProfile.thresholds.transport === 'motorcycle' ? '🏍️ موتور' : '🚌 عمومی'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">پنجره طلایی:</span>
            <span className="font-medium text-success">{otherWindow}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setActiveProfile(otherProfile.id)}
            className="flex-1 btn-primary text-sm"
          >
            فعال کن
          </button>
          <button
            onClick={() => setEditingProfile(otherProfile.id)}
            className="btn-secondary text-sm flex items-center gap-1"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Comparison */}
      {weatherData && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">مقایسه: تو در برابر {otherProfile.name}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/30">
              <span className="text-sm">پنجره طلایی تو:</span>
              <span className="text-sm font-medium text-accent">{activeWindow}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/30">
              <span className="text-sm">پنجره طلایی {otherProfile.name}:</span>
              <span className="text-sm font-medium text-success">{otherWindow}</span>
            </div>
            <div className="text-xs text-text-secondary text-center mt-2">
              💡 تفاوت آستانه‌ها باعث می‌شود پنجره‌های طلایی متفاوتی داشته باشید
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

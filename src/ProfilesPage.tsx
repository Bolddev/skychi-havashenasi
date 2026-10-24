import { useState } from 'react';
import { useStore } from './store';
import { Users, User, Settings } from 'lucide-react';
import { Onboarding } from './Onboarding';

export function ProfilesPage() {
  const { profiles, activeProfileId, setActiveProfile, weatherData, decision } = useStore();
  const [editingProfile, setEditingProfile] = useState<string | null>(null);

  if (editingProfile) {
    return <Onboarding editProfileId={editingProfile} onComplete={() => setEditingProfile(null)} />;
  }

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];
  const otherProfile = profiles.find((p) => p.id !== activeProfileId) || profiles[1];

  const formatWindow = (profileId: string) => {
    if (!decision) return '—';
    // فعلاً فقط پنجره پروفایل فعال را داریم
    if (profileId === activeProfileId && decision.goldenWindow) {
      const s = decision.goldenWindow.start;
      const e = decision.goldenWindow.end;
      return `${s.getHours()}:${s.getMinutes().toString().padStart(2, '0')}–${e.getHours()}:${e.getMinutes().toString().padStart(2, '0')}`;
    }
    return '—';
  };

  return (
    <div className="pb-24 space-y-4 animate-fade-in">
      <div className="px-1">
        <h1 className="text-2xl font-semibold text-text-primary">پروفایل‌ها</h1>
        <p className="text-sm text-text-secondary">مدیریت پروفایل‌های مختلف</p>
      </div>

      {/* Active Profile */}
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
            <span className="font-medium tabular-nums">{activeProfile.coldComfortThreshold}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">حمل‌ونقل:</span>
            <span className="font-medium">
              {activeProfile.transport === 'walking' ? '🚶 پیاده' :
               activeProfile.transport === 'car' ? '🚗 ماشین' :
               activeProfile.transport === 'bike' ? '🚲 دوچرخه' :
               activeProfile.transport === 'motorcycle' ? '🏍️ موتور' : '🚌 عمومی'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">پنجره طلایی:</span>
            <span className="font-medium text-success">{formatWindow(activeProfile.id)}</span>
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

      {/* Other Profile */}
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
            <span className="font-medium tabular-nums">{otherProfile.coldComfortThreshold}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">حمل‌ونقل:</span>
            <span className="font-medium">
              {otherProfile.transport === 'walking' ? '🚶 پیاده' :
               otherProfile.transport === 'car' ? '🚗 ماشین' :
               otherProfile.transport === 'bike' ? '🚲 دوچرخه' :
               otherProfile.transport === 'motorcycle' ? '🏍️ موتور' : '🚌 عمومی'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button onClick={() => setActiveProfile(otherProfile.id)} className="flex-1 btn-primary text-sm">
            فعال کن
          </button>
          <button onClick={() => setEditingProfile(otherProfile.id)} className="btn-secondary text-sm flex items-center gap-1">
            <Settings size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

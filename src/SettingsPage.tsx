import { useStore } from './store';
import { Settings, MapPin, Bell, Edit, RotateCcw } from 'lucide-react';
import { Onboarding } from './Onboarding';
import { useState } from 'react';
import type { Gear, Activity } from './types';

export function SettingsPage() {
  const { getActiveProfile, setOnboardingComplete } = useStore();
  const [editing, setEditing] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const profile = getActiveProfile();

  if (editing) {
    return <Onboarding editProfileId={profile.id} onComplete={() => setEditing(false)} />;
  }

  const handleReset = () => {
    localStorage.removeItem('skychi-storage');
    window.location.reload();
  };

  const gearLabels: Record<string, string> = {
    umbrella: '☂️ چتر', raincoat: '🧥 بارانی', jacket: '🧥 کاپشن',
    hat: '🎩 کلاه', gloves: '🧤 دستکش', sunscreen: '🧴 ضدآفتاب',
  };

  const activityLabels: Record<string, string> = {
    park: '🌳 پارک', walking: '🚶 پیاده‌روی', picnic: '🧺 پیک‌نیک',
    shopping: '🛍️ خرید', sports: '🏃 ورزش', photography: '📷 عکاسی',
  };

  return (
    <div className="pb-24 space-y-4 animate-fade-in">
      <div className="px-1">
        <h1 className="text-2xl font-semibold text-text-primary">تنظیمات</h1>
        <p className="text-sm text-text-secondary">شخصی‌سازی تجربه شما</p>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={18} className="text-accent" />
          <h3 className="text-sm font-medium">موقعیت</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">قرچک، استان تهران</div>
            <div className="text-xs text-text-secondary">۳۵.۴۳° شمالی، ۵۱.۵۸° شرقی</div>
          </div>
          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">فعال</span>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Edit size={18} className="text-accent" />
          <h3 className="text-sm font-medium">آستانه‌های پروفایل</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">آستانه سرما:</span>
            <span className="font-medium tabular-nums">{profile.coldComfortThreshold}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">آستانه گرما:</span>
            <span className="font-medium tabular-nums">{profile.heatThreshold}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">آستانه باد:</span>
            <span className="font-medium tabular-nums">{profile.windAnnoyThreshold} km/h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">نسیم آزاردهنده:</span>
            <span className="font-medium tabular-nums">{profile.breezeAnnoyThreshold} km/h</span>
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="mt-3 w-full btn-secondary text-sm">
          ویرایش آستانه‌ها
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={18} className="text-accent" />
          <h3 className="text-sm font-medium">اعلان‌ها</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">قبل از خروج:</span>
            <span className="font-medium">{profile.notifications.leadTime === 30 ? '۳۰ دقیقه' : profile.notifications.leadTime === 60 ? '۱ ساعت' : '۲ ساعت'}</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">تجهیزات من</h3>
        <div className="flex flex-wrap gap-2">
          {profile.gear.map((eq: Gear) => (
            <span key={eq} className="text-xs bg-white/50 px-2 py-1 rounded-lg">
              {gearLabels[eq] || eq}
            </span>
          ))}
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">فعالیت‌های من</h3>
        <div className="flex flex-wrap gap-2">
          {profile.activities.map((act: Activity) => (
            <span key={act} className="text-xs bg-white/50 px-2 py-1 rounded-lg">
              {activityLabels[act] || act}
            </span>
          ))}
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw size={18} className="text-danger" />
          <h3 className="text-sm font-medium">بازنشانی</h3>
        </div>
        {showReset ? (
          <div className="space-y-2">
            <p className="text-sm text-danger">مطمئنی؟ تمام تنظیمات پاک می‌شوند.</p>
            <div className="flex gap-2">
              <button onClick={handleReset} className="flex-1 py-2 bg-danger text-white rounded-xl text-sm font-medium">بله، پاک کن</button>
              <button onClick={() => setShowReset(false)} className="flex-1 py-2 glass-card text-sm">انصراف</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowReset(true)} className="w-full py-2 border border-danger/30 text-danger rounded-xl text-sm">
            بازنشانی همه تنظیمات
          </button>
        )}
      </div>

      <div className="glass-card p-4 text-center">
        <p className="text-lg font-semibold text-accent">اسکایچی</p>
        <p className="text-xs text-text-secondary mt-1">دستیار تصمیم هوای بعدازظهر</p>
        <p className="text-xs text-text-secondary mt-2">داده‌ها: Open-Meteo API</p>
        <p className="text-xs text-text-secondary">نسخه ۲.۰ — وب</p>
      </div>
    </div>
  );
}

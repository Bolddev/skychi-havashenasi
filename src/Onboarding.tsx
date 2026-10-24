import { useState } from 'react';
import { useStore } from './store';
import type { UserProfile, Activity, Gear } from './types';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface Props {
  onComplete: () => void;
  editProfileId?: string;
}

export function Onboarding({ onComplete, editProfileId }: Props) {
  const { profiles, updateProfile, setOnboardingComplete } = useStore();
  const profile = editProfileId
    ? profiles.find((p) => p.id === editProfileId) || profiles[0]
    : profiles[0];

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<UserProfile>>(profile);

  const totalSteps = editProfileId ? 3 : 7;

  const update = (partial: Partial<UserProfile>) => {
    setAnswers((prev: Partial<UserProfile>) => ({ ...prev, ...partial }));
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      updateProfile(profile.id, answers);
      if (!editProfileId) {
        setOnboardingComplete(true);
      }
      onComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-app flex flex-col p-4">
      <div className="w-full h-2 bg-white/40 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="glass-card p-6 animate-fade-in">
          {editProfileId ? renderEditStep(step, answers, update) : renderStep(step, answers, update)}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="btn-secondary flex items-center gap-1 disabled:opacity-30"
          >
            <ChevronRight size={18} />
            قبلی
          </button>
          <span className="text-text-secondary text-sm tabular-nums">
            {step + 1} / {totalSteps}
          </span>
          <button onClick={handleNext} className="btn-primary flex items-center gap-1">
            {step === totalSteps - 1 ? (
              <>
                <Check size={18} />
                {editProfileId ? 'ذخیره' : 'شروع'}
              </>
            ) : (
              <>
                بعدی
                <ChevronLeft size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function renderStep(step: number, answers: Partial<UserProfile>, update: (p: Partial<UserProfile>) => void) {
  switch (step) {
    case 0: return <Step1Sensitivity answers={answers} update={update} />;
    case 1: return <Step2Preferences answers={answers} update={update} />;
    case 2: return <Step3Transport answers={answers} update={update} />;
    case 3: return <Step4Equipment answers={answers} update={update} />;
    case 4: return <Step5Car answers={answers} update={update} />;
    case 5: return <Step6Health answers={answers} update={update} />;
    case 6: return <Step7Notifications answers={answers} update={update} />;
    default: return null;
  }
}

function renderEditStep(step: number, answers: Partial<UserProfile>, update: (p: Partial<UserProfile>) => void) {
  switch (step) {
    case 0: return <Step1Sensitivity answers={answers} update={update} />;
    case 1: return <Step3Transport answers={answers} update={update} />;
    case 2: return <Step4Equipment answers={answers} update={update} />;
    default: return null;
  }
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold text-text-primary mb-4">{children}</h2>;
}

function OptionButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl text-right transition-all ${
        selected ? 'bg-accent text-white shadow-lg' : 'glass-card hover:bg-white/80'
      }`}
    >
      {children}
    </button>
  );
}

function MultiOption({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl text-center transition-all text-sm ${
        selected ? 'bg-accent text-white shadow-lg' : 'glass-card hover:bg-white/80'
      }`}
    >
      {children}
    </button>
  );
}

function Step1Sensitivity({ answers, update }: { answers: Partial<UserProfile>; update: (p: Partial<UserProfile>) => void }) {
  return (
    <div className="space-y-5">
      <StepTitle>🌡️ حساسیت فیزیکی</StepTitle>
      
      <div>
        <p className="text-sm text-text-secondary mb-2">باد چقدر آزارت می‌دهد؟</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => update({ windAnnoyThreshold: 45 - 6 * v })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                answers.windAnnoyThreshold === 45 - 6 * v ? 'bg-accent text-white' : 'glass-card'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>خیلی</span><span>کم</span>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">سرما چقدر زود به تو می‌زند؟</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.coldComfortThreshold === 18} onClick={() => update({ coldComfortThreshold: 18 })}>زود</OptionButton>
          <OptionButton selected={answers.coldComfortThreshold === 14} onClick={() => update({ coldComfortThreshold: 14 })}>متوسط</OptionButton>
          <OptionButton selected={answers.coldComfortThreshold === 10} onClick={() => update({ coldComfortThreshold: 10 })}>دیر</OptionButton>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">گرما چقدر آزارت می‌دهد؟</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.heatThreshold === 26} onClick={() => update({ heatThreshold: 26 })}>حساس</OptionButton>
          <OptionButton selected={answers.heatThreshold === 30} onClick={() => update({ heatThreshold: 30 })}>متوسط</OptionButton>
          <OptionButton selected={answers.heatThreshold === 34} onClick={() => update({ heatThreshold: 34 })}>مقاوم</OptionButton>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">باد سرد نفوذی اذیتت می‌کند؟</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.breezeAnnoyThreshold === 10} onClick={() => update({ breezeAnnoyThreshold: 10 })}>بله</OptionButton>
          <OptionButton selected={answers.breezeAnnoyThreshold === 18} onClick={() => update({ breezeAnnoyThreshold: 18 })}>کمی</OptionButton>
          <OptionButton selected={answers.breezeAnnoyThreshold === 25} onClick={() => update({ breezeAnnoyThreshold: 25 })}>نه</OptionButton>
        </div>
      </div>
    </div>
  );
}

function Step2Preferences({ answers, update }: { answers: Partial<UserProfile>; update: (p: Partial<UserProfile>) => void }) {
  return (
    <div className="space-y-5">
      <StepTitle>☁️ ترجیحات تجربه</StepTitle>

      <div>
        <p className="text-sm text-text-secondary mb-2">ترجیح می‌دهی روز بیرون باشی یا شب؟</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.dayNightPreference === 'day'} onClick={() => update({ dayNightPreference: 'day' })}>☀️ روز</OptionButton>
          <OptionButton selected={answers.dayNightPreference === 'any'} onClick={() => update({ dayNightPreference: 'any' })}>🔄 فرقی نداره</OptionButton>
          <OptionButton selected={answers.dayNightPreference === 'night'} onClick={() => update({ dayNightPreference: 'night' })}>🌙 شب</OptionButton>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">ساعت طلایی عکاسی نمایش داده شود؟</p>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton selected={answers.showGoldenHour === true} onClick={() => update({ showGoldenHour: true })}>بله</OptionButton>
          <OptionButton selected={answers.showGoldenHour === false} onClick={() => update({ showGoldenHour: false })}>خیر</OptionButton>
        </div>
      </div>
    </div>
  );
}

function Step3Transport({ answers, update }: { answers: Partial<UserProfile>; update: (p: Partial<UserProfile>) => void }) {
  const activities = answers.activities || [];
  const toggleActivity = (a: Activity) => {
    const newActivities = activities.includes(a)
      ? activities.filter((x: Activity) => x !== a)
      : [...activities, a];
    update({ activities: newActivities });
  };

  return (
    <div className="space-y-5">
      <StepTitle>🚶 حمل‌ونقل و فعالیت</StepTitle>

      <div>
        <p className="text-sm text-text-secondary mb-2">معمولاً چطور بیرون می‌روی؟</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.transport === 'walking'} onClick={() => update({ transport: 'walking' })}>🚶 پیاده</OptionButton>
          <OptionButton selected={answers.transport === 'bike'} onClick={() => update({ transport: 'bike' })}>🚲 دوچرخه</OptionButton>
          <OptionButton selected={answers.transport === 'motorcycle'} onClick={() => update({ transport: 'motorcycle' })}>🏍️ موتور</OptionButton>
          <OptionButton selected={answers.transport === 'car'} onClick={() => update({ transport: 'car' })}>🚗 ماشین</OptionButton>
          <OptionButton selected={answers.transport === 'public'} onClick={() => update({ transport: 'public' })}>🚌 عمومی</OptionButton>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">فعالیت‌های معمول:</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: 'park' as Activity, label: '🌳 پارک' },
            { id: 'walking' as Activity, label: '🚶 پیاده‌روی' },
            { id: 'picnic' as Activity, label: '🧺 پیک‌نیک' },
            { id: 'shopping' as Activity, label: '🛍️ خرید' },
            { id: 'sports' as Activity, label: '🏃 ورزش' },
            { id: 'photography' as Activity, label: '📷 عکاسی' },
          ]).map((a) => (
            <MultiOption key={a.id} selected={activities.includes(a.id)} onClick={() => toggleActivity(a.id)}>
              {a.label}
            </MultiOption>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">مدت معمول بیرون بودن (ساعت):</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.typicalOutingDuration === 2} onClick={() => update({ typicalOutingDuration: 2 })}>۱-۲ ساعت</OptionButton>
          <OptionButton selected={answers.typicalOutingDuration === 3} onClick={() => update({ typicalOutingDuration: 3 })}>۳-۴ ساعت</OptionButton>
          <OptionButton selected={answers.typicalOutingDuration === 5} onClick={() => update({ typicalOutingDuration: 5 })}>بیشتر</OptionButton>
        </div>
      </div>
    </div>
  );
}

function Step4Equipment({ answers, update }: { answers: Partial<UserProfile>; update: (p: Partial<UserProfile>) => void }) {
  const gear = answers.gear || [];
  const toggleGear = (e: Gear) => {
    const newGear = gear.includes(e) ? gear.filter((x: Gear) => x !== e) : [...gear, e];
    update({ gear: newGear });
  };

  return (
    <div className="space-y-5">
      <StepTitle>🎒 تجهیزات</StepTitle>

      <div>
        <p className="text-sm text-text-secondary mb-2">چه تجهیزاتی داری؟</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: 'umbrella' as Gear, label: '☂️ چتر' },
            { id: 'raincoat' as Gear, label: '🧥 بارانی' },
            { id: 'jacket' as Gear, label: '🧥 کاپشن' },
            { id: 'hat' as Gear, label: '🎩 کلاه' },
            { id: 'gloves' as Gear, label: '🧤 دستکش' },
            { id: 'sunscreen' as Gear, label: '🧴 ضدآفتاب' },
          ]).map((e) => (
            <MultiOption key={e.id} selected={gear.includes(e.id)} onClick={() => toggleGear(e.id)}>
              {e.label}
            </MultiOption>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">چتر در باد آزارت داده؟</p>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton selected={answers.umbrellaBadInWind === true} onClick={() => update({ umbrellaBadInWind: true })}>بله</OptionButton>
          <OptionButton selected={answers.umbrellaBadInWind === false} onClick={() => update({ umbrellaBadInWind: false })}>خیر</OptionButton>
        </div>
      </div>
    </div>
  );
}

function Step5Car({ answers, update }: { answers: Partial<UserProfile>; update: (p: Partial<UserProfile>) => void }) {
  return (
    <div className="space-y-5">
      <StepTitle>🚗 خودرو</StepTitle>

      <div>
        <p className="text-sm text-text-secondary mb-2">ماشین داری؟</p>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton selected={answers.hasCar === true} onClick={() => update({ hasCar: true })}>بله</OptionButton>
          <OptionButton selected={answers.hasCar === false} onClick={() => update({ hasCar: false })}>خیر</OptionButton>
        </div>
      </div>

      {answers.hasCar && (
        <>
          <div>
            <p className="text-sm text-text-secondary mb-2">کجا پارک می‌کنی؟</p>
            <div className="grid grid-cols-2 gap-2">
              <OptionButton selected={answers.parking === 'street'} onClick={() => update({ parking: 'street' })}>خیابان</OptionButton>
              <OptionButton selected={answers.parking === 'covered'} onClick={() => update({ parking: 'covered' })}>سرپوشیده</OptionButton>
            </div>
          </div>

          <div>
            <p className="text-sm text-text-secondary mb-2">شستن ماشین برایت مهم است؟</p>
            <div className="grid grid-cols-3 gap-2">
              <OptionButton selected={answers.carWashImportance === 'high'} onClick={() => update({ carWashImportance: 'high' })}>بله</OptionButton>
              <OptionButton selected={answers.carWashImportance === 'medium'} onClick={() => update({ carWashImportance: 'medium' })}>گاهی</OptionButton>
              <OptionButton selected={answers.carWashImportance === 'low'} onClick={() => update({ carWashImportance: 'low' })}>نه</OptionButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Step6Health({ answers, update }: { answers: Partial<UserProfile>; update: (p: Partial<UserProfile>) => void }) {
  return (
    <div className="space-y-5">
      <StepTitle>💊 سلامت (اختیاری)</StepTitle>

      <div>
        <p className="text-sm text-text-secondary mb-2">آلرژی فصلی؟</p>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton selected={answers.seasonalAllergy === true} onClick={() => update({ seasonalAllergy: true })}>بله</OptionButton>
          <OptionButton selected={answers.seasonalAllergy === false} onClick={() => update({ seasonalAllergy: false })}>خیر</OptionButton>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">درد مفاصل با سرما/رطوبت؟</p>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton selected={answers.jointPain === true} onClick={() => update({ jointPain: true })}>بله</OptionButton>
          <OptionButton selected={answers.jointPain === false} onClick={() => update({ jointPain: false })}>خیر</OptionButton>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">مشکل تنفسی؟</p>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton selected={answers.respiratoryIssue === true} onClick={() => update({ respiratoryIssue: true })}>بله</OptionButton>
          <OptionButton selected={answers.respiratoryIssue === false} onClick={() => update({ respiratoryIssue: false })}>خیر</OptionButton>
        </div>
      </div>
    </div>
  );
}

function Step7Notifications({ answers, update }: { answers: Partial<UserProfile>; update: (p: Partial<UserProfile>) => void }) {
  return (
    <div className="space-y-5">
      <StepTitle>🔔 اعلان‌ها</StepTitle>

      <div>
        <p className="text-sm text-text-secondary mb-2">چقدر قبل از خروج؟</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.notifications?.leadTime === 30} onClick={() => update({ notifications: { enabled: true, times: ['before'], leadTime: 30 } })}>۳۰ دقیقه</OptionButton>
          <OptionButton selected={answers.notifications?.leadTime === 60} onClick={() => update({ notifications: { enabled: true, times: ['before'], leadTime: 60 } })}>۱ ساعت</OptionButton>
          <OptionButton selected={answers.notifications?.leadTime === 120} onClick={() => update({ notifications: { enabled: true, times: ['before'], leadTime: 120 } })}>۲ ساعت</OptionButton>
        </div>
      </div>
    </div>
  );
}

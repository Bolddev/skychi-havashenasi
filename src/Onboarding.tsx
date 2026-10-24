import { useState } from 'react';
import { useStore, ProfileThresholds } from './store';
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
  const [answers, setAnswers] = useState<Partial<ProfileThresholds>>(profile.thresholds);

  const totalSteps = editProfileId ? 3 : 7;

  const update = (partial: Partial<ProfileThresholds>) => {
    setAnswers((prev) => ({ ...prev, ...partial }));
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
      {/* Progress bar */}
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

        {/* Navigation */}
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

function renderStep(step: number, answers: Partial<ProfileThresholds>, update: (p: Partial<ProfileThresholds>) => void) {
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

function renderEditStep(step: number, answers: Partial<ProfileThresholds>, update: (p: Partial<ProfileThresholds>) => void) {
  switch (step) {
    case 0: return <Step1Sensitivity answers={answers} update={update} />;
    case 1: return <Step3Transport answers={answers} update={update} />;
    case 2: return <Step4Equipment answers={answers} update={update} />;
    default: return null;
  }
}

// Step components
function StepTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold text-text-primary mb-4">{children}</h2>;
}

function OptionButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl text-right transition-all ${
        selected
          ? 'bg-accent text-white shadow-lg'
          : 'glass-card hover:bg-white/80'
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
      className={`p-3 rounded-xl text-center transition-all ${
        selected
          ? 'bg-accent text-white shadow-lg'
          : 'glass-card hover:bg-white/80'
      }`}
    >
      {children}
    </button>
  );
}

function Step1Sensitivity({ answers, update }: { answers: Partial<ProfileThresholds>; update: (p: Partial<ProfileThresholds>) => void }) {
  return (
    <div className="space-y-5">
      <StepTitle>🌡️ حساسیت فیزیکی</StepTitle>
      
      <div>
        <p className="text-sm text-text-secondary mb-2">باد چقدر آزارت می‌دهد؟</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => update({ windThreshold: 45 - 6 * v })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                answers.windThreshold === 45 - 6 * v
                  ? 'bg-accent text-white'
                  : 'glass-card'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>خیلی</span>
          <span>کم</span>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">سرما چقدر زود به تو می‌زند؟</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.coldThreshold === 18} onClick={() => update({ coldThreshold: 18 })}>زود</OptionButton>
          <OptionButton selected={answers.coldThreshold === 14} onClick={() => update({ coldThreshold: 14 })}>متوسط</OptionButton>
          <OptionButton selected={answers.coldThreshold === 10} onClick={() => update({ coldThreshold: 10 })}>دیر</OptionButton>
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
          <OptionButton selected={answers.breezeThreshold === 10} onClick={() => update({ breezeThreshold: 10 })}>بله</OptionButton>
          <OptionButton selected={answers.breezeThreshold === 18} onClick={() => update({ breezeThreshold: 18 })}>کمی</OptionButton>
          <OptionButton selected={answers.breezeThreshold === 25} onClick={() => update({ breezeThreshold: 25 })}>نه</OptionButton>
        </div>
      </div>
    </div>
  );
}

function Step2Preferences({ answers, update }: { answers: Partial<ProfileThresholds>; update: (p: Partial<ProfileThresholds>) => void }) {
  return (
    <div className="space-y-5">
      <StepTitle>☁️ ترجیحات تجربه</StepTitle>

      <div>
        <p className="text-sm text-text-secondary mb-2">باران را چطور می‌بینی؟</p>
        <div className="grid grid-cols-4 gap-2">
          <OptionButton selected={answers.rainFeeling === 1} onClick={() => update({ rainFeeling: 1 })}>متنفرم</OptionButton>
          <OptionButton selected={answers.rainFeeling === 2} onClick={() => update({ rainFeeling: 2 })}>بدم میاد</OptionButton>
          <OptionButton selected={answers.rainFeeling === 3} onClick={() => update({ rainFeeling: 3 })}>مهم نیست</OptionButton>
          <OptionButton selected={answers.rainFeeling === 4} onClick={() => update({ rainFeeling: 4 })}>دوست دارم</OptionButton>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">برف؟</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.snowFeeling === 1} onClick={() => update({ snowFeeling: 1 })}>دوست دارم</OptionButton>
          <OptionButton selected={answers.snowFeeling === 2} onClick={() => update({ snowFeeling: 2 })}>مهم نیست</OptionButton>
          <OptionButton selected={answers.snowFeeling === 3} onClick={() => update({ snowFeeling: 3 })}>متنفرم</OptionButton>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">آفتاب مستقیم؟</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.sunFeeling === 1} onClick={() => update({ sunFeeling: 1 })}>دوست دارم</OptionButton>
          <OptionButton selected={answers.sunFeeling === 2} onClick={() => update({ sunFeeling: 2 })}>مهم نیست</OptionButton>
          <OptionButton selected={answers.sunFeeling === 3} onClick={() => update({ sunFeeling: 3 })}>اجتناب</OptionButton>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">ترجیح می‌دهی روز بیرون باشی یا شب؟</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.timePreference === 'day'} onClick={() => update({ timePreference: 'day' })}>☀️ روز</OptionButton>
          <OptionButton selected={answers.timePreference === 'any'} onClick={() => update({ timePreference: 'any' })}>🔄 فرقی نداره</OptionButton>
          <OptionButton selected={answers.timePreference === 'night'} onClick={() => update({ timePreference: 'night' })}>🌙 شب</OptionButton>
        </div>
      </div>
    </div>
  );
}

function Step3Transport({ answers, update }: { answers: Partial<ProfileThresholds>; update: (p: Partial<ProfileThresholds>) => void }) {
  const activities = answers.activities || [];
  const toggleActivity = (a: string) => {
    const newActivities = activities.includes(a)
      ? activities.filter((x) => x !== a)
      : [...activities, a];
    update({ activities: newActivities });
  };

  return (
    <div className="space-y-5">
      <StepTitle>🚶 حمل‌ونقل و فعالیت</StepTitle>

      <div>
        <p className="text-sm text-text-secondary mb-2">معمولاً چطور بیرون می‌روی؟</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.transport === 'walk'} onClick={() => update({ transport: 'walk' })}>🚶 پیاده</OptionButton>
          <OptionButton selected={answers.transport === 'bike'} onClick={() => update({ transport: 'bike' })}>🚲 دوچرخه</OptionButton>
          <OptionButton selected={answers.transport === 'motorcycle'} onClick={() => update({ transport: 'motorcycle' })}>🏍️ موتور</OptionButton>
          <OptionButton selected={answers.transport === 'car'} onClick={() => update({ transport: 'car' })}>🚗 ماشین</OptionButton>
          <OptionButton selected={answers.transport === 'public'} onClick={() => update({ transport: 'public' })}>🚌 عمومی</OptionButton>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">فعالیت‌های معمول:</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'park', label: '🌳 پارک' },
            { id: 'walk', label: '🚶 پیاده‌روی' },
            { id: 'picnic', label: '🧺 پیک‌نیک' },
            { id: 'shopping', label: '🛍️ خرید' },
            { id: 'exercise', label: '🏃 ورزش' },
            { id: 'photography', label: '📷 عکاسی' },
          ].map((a) => (
            <MultiOption key={a.id} selected={activities.includes(a.id)} onClick={() => toggleActivity(a.id)}>
              {a.label}
            </MultiOption>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">مدت معمول بیرون بودن:</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.duration === '1-2'} onClick={() => update({ duration: '1-2' })}>۱-۲ ساعت</OptionButton>
          <OptionButton selected={answers.duration === '3-4'} onClick={() => update({ duration: '3-4' })}>۳-۴ ساعت</OptionButton>
          <OptionButton selected={answers.duration === '5+'} onClick={() => update({ duration: '5+' })}>بیشتر</OptionButton>
        </div>
      </div>
    </div>
  );
}

function Step4Equipment({ answers, update }: { answers: Partial<ProfileThresholds>; update: (p: Partial<ProfileThresholds>) => void }) {
  const equipment = answers.equipment || [];
  const toggleEquip = (e: string) => {
    const newEquip = equipment.includes(e)
      ? equipment.filter((x) => x !== e)
      : [...equipment, e];
    update({ equipment: newEquip });
  };

  return (
    <div className="space-y-5">
      <StepTitle>🎒 تجهیزات</StepTitle>

      <div>
        <p className="text-sm text-text-secondary mb-2">چه تجهیزاتی داری؟</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'umbrella', label: '☂️ چتر' },
            { id: 'raincoat', label: '🧥 بارانی' },
            { id: 'jacket', label: '🧥 کاپشن' },
            { id: 'hat', label: '🎩 کلاه' },
            { id: 'gloves', label: '🧤 دستکش' },
            { id: 'sunscreen', label: '🧴 ضدآفتاب' },
          ].map((e) => (
            <MultiOption key={e.id} selected={equipment.includes(e.id)} onClick={() => toggleEquip(e.id)}>
              {e.label}
            </MultiOption>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5Car({ answers, update }: { answers: Partial<ProfileThresholds>; update: (p: Partial<ProfileThresholds>) => void }) {
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
              <OptionButton selected={answers.carWashImportant === 'yes'} onClick={() => update({ carWashImportant: 'yes' })}>بله</OptionButton>
              <OptionButton selected={answers.carWashImportant === 'sometimes'} onClick={() => update({ carWashImportant: 'sometimes' })}>گاهی</OptionButton>
              <OptionButton selected={answers.carWashImportant === 'no'} onClick={() => update({ carWashImportant: 'no' })}>نه</OptionButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Step6Health({ answers, update }: { answers: Partial<ProfileThresholds>; update: (p: Partial<ProfileThresholds>) => void }) {
  return (
    <div className="space-y-5">
      <StepTitle>💊 سلامت (اختیاری)</StepTitle>

      <div>
        <p className="text-sm text-text-secondary mb-2">آلرژی فصلی؟</p>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton selected={answers.hasAllergy === true} onClick={() => update({ hasAllergy: true })}>بله</OptionButton>
          <OptionButton selected={answers.hasAllergy === false} onClick={() => update({ hasAllergy: false })}>خیر</OptionButton>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">درد مفاصل با سرما/رطوبت؟</p>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton selected={answers.hasJointPain === true} onClick={() => update({ hasJointPain: true })}>بله</OptionButton>
          <OptionButton selected={answers.hasJointPain === false} onClick={() => update({ hasJointPain: false })}>خیر</OptionButton>
        </div>
      </div>
    </div>
  );
}

function Step7Notifications({ answers, update }: { answers: Partial<ProfileThresholds>; update: (p: Partial<ProfileThresholds>) => void }) {
  return (
    <div className="space-y-5">
      <StepTitle>🔔 اعلان‌ها</StepTitle>

      <div>
        <p className="text-sm text-text-secondary mb-2">چه زمانی اعلان بگیری؟</p>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton selected={answers.notificationTime === 'morning'} onClick={() => update({ notificationTime: 'morning' })}>🌅 صبح</OptionButton>
          <OptionButton selected={answers.notificationTime === 'noon'} onClick={() => update({ notificationTime: 'noon' })}>☀️ ظهر</OptionButton>
          <OptionButton selected={answers.notificationTime === 'before'} onClick={() => update({ notificationTime: 'before' })}>🚪 قبل خروج</OptionButton>
          <OptionButton selected={answers.notificationTime === 'all'} onClick={() => update({ notificationTime: 'all' })}>📱 همه</OptionButton>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">چقدر قبل از خروج؟</p>
        <div className="grid grid-cols-3 gap-2">
          <OptionButton selected={answers.notificationBefore === '30'} onClick={() => update({ notificationBefore: '30' })}>۳۰ دقیقه</OptionButton>
          <OptionButton selected={answers.notificationBefore === '60'} onClick={() => update({ notificationBefore: '60' })}>۱ ساعت</OptionButton>
          <OptionButton selected={answers.notificationBefore === '120'} onClick={() => update({ notificationBefore: '120' })}>۲ ساعت</OptionButton>
        </div>
      </div>
    </div>
  );
}

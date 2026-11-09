import { Button } from '../components/ui';

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
        {/* لوگو */}
        <div className="glass-2 rounded-3xl p-8 inline-block">
          <div className="text-7xl mb-2">🌤️</div>
        </div>

        {/* عنوان */}
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">اسکای‌چی</h1>
          <p className="text-lg text-text-secondary">
            بگو امروز کِی و چی بپوشم، نه اینکه دما چنده.
          </p>
        </div>

        {/* توضیح */}
        <div className="glass-2 rounded-2xl p-5 text-right space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="font-semibold text-sm mb-1">تصمیم‌گیری هوشمند</h3>
              <p className="text-xs text-text-secondary">
                بر اساس آستانه‌های شخصی تو، بهترین زمان خروج را پیشنهاد می‌دهد.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">🌡️</span>
            <div>
              <h3 className="font-semibold text-sm mb-1">شوک دمایی</h3>
              <p className="text-xs text-text-secondary">
                هشدار افت ناگهانی دما نسبت به دیروز.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <h3 className="font-semibold text-sm mb-1">مقایسه با دوستان</h3>
              <p className="text-xs text-text-secondary">
                پنجره طلایی مشترک برای قرارهای دوستانه.
              </p>
            </div>
          </div>
        </div>

        {/* دکمه شروع */}
        <Button onClick={onStart} className="w-full" size="lg">
          شروع
        </Button>

        {/* لینک بازیابی */}
        <button className="text-xs text-text-tertiary hover:text-accent transition-colors">
          قبلاً استفاده کردی؟ بازیابی تنظیمات
        </button>
      </div>
    </div>
  );
}

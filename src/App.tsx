import { useStore } from './store';
import { HomePage } from './HomePage';
import { WeekPage } from './WeekPage';
import { ProfilesPage } from './ProfilesPage';
import { SettingsPage } from './SettingsPage';
import { Onboarding } from './Onboarding';
import { Home, Calendar, Users, Settings } from 'lucide-react';

function BottomNav() {
  const { currentPage, setCurrentPage } = useStore();

  const navItems = [
    { id: 'home' as const, icon: Home, label: 'خانه' },
    { id: 'week' as const, icon: Calendar, label: 'هفته' },
    { id: 'profiles' as const, icon: Users, label: 'پروفایل' },
    { id: 'settings' as const, icon: Settings, label: 'تنظیمات' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-nav z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? 'text-accent bg-accent/10'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AppContent() {
  const { currentPage } = useStore();

  switch (currentPage) {
    case 'home':
      return <HomePage />;
    case 'week':
      return <WeekPage />;
    case 'profiles':
      return <ProfilesPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <HomePage />;
  }
}

export default function App() {
  const { onboardingComplete } = useStore();

  if (!onboardingComplete) {
    return <Onboarding onComplete={() => {}} />;
  }

  return (
    <div className="bg-app min-h-screen min-h-[100dvh]">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <AppContent />
      </div>
      <BottomNav />
    </div>
  );
}

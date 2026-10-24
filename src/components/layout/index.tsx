import { type ReactNode } from 'react';
import { useStore } from '../../store';
import { Sun, Calendar, Users, Settings, MapPin, RefreshCw } from 'lucide-react';

// ============================================================
// Header
// ============================================================
export function Header() {
  const { decision, lastFetch } = useStore();

  const minutesAgo = decision?.lastUpdated.minutesAgo ?? 0;
  const isStale = decision?.lastUpdated.isStale ?? false;

  return (
    <header className="glass-3 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-lg mx-auto">
        {/* خط اول */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌤️</span>
            <h1 className="text-xl font-bold text-text-primary">اسکای‌چی</h1>
          </div>
          <div className="flex items-center gap-1 text-sm text-text-secondary">
            <MapPin size={14} />
            <span>قرچک</span>
          </div>
        </div>

        {/* خط دوم */}
        <div className="flex items-center gap-2 text-xs">
          {isStale ? (
            <span className="text-warning flex items-center gap-1">
              <RefreshCw size={12} />
              داده {minutesAgo} دقیقه پیش — برای به‌روزرسانی بکش
            </span>
          ) : (
            <span className="text-text-tertiary">
              🔄 آخرین به‌روزرسانی: {minutesAgo === 0 ? 'الان' : `${minutesAgo} دقیقه پیش`}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

// ============================================================
// BottomNav
// ============================================================
export function BottomNav() {
  const { currentPage, setCurrentPage } = useStore();

  const navItems = [
    { id: 'home' as const, icon: Sun, label: 'امروز' },
    { id: 'week' as const, icon: Calendar, label: 'هفته' },
    { id: 'profiles' as const, icon: Users, label: 'پروفایل' },
    { id: 'settings' as const, icon: Settings, label: 'تنظیمات' },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="glass-3 rounded-3xl px-2 py-2 shadow-lg">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all min-w-[64px] ${
                  isActive
                    ? 'text-accent bg-accent-ghost'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// AppShell
// ============================================================
interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="bg-app min-h-screen min-h-[100dvh]">
      <Header />
      <main className="max-w-lg mx-auto px-4 pb-32">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

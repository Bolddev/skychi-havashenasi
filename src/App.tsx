import { useStore } from './store';
import { Onboarding } from './Onboarding';
import { WelcomeScreen } from './screens/Welcome';
import { AppShell } from './components/layout';
import { HomeScreen } from './screens/Home';
import { WeekPage } from './screens/Week';
import { ProfilesPage } from './ProfilesPage';
import { SettingsPage } from './SettingsPage';
import { useState } from 'react';
import { useInstallPrompt } from './pwa/installPrompt';
import { GlassCard, Button } from './components/ui';

function AppContent() {
  const { currentPage } = useStore();

  switch (currentPage) {
    case 'home':
      return <HomeScreen />;
    case 'week':
      return <WeekPage />;
    case 'profiles':
      return <ProfilesPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <HomeScreen />;
  }
}

export default function App() {
  const { onboardingComplete } = useStore();
  const [showWelcome, setShowWelcome] = useState(true);
  const { isInstallable, isInstalled, promptInstall, dismissInstall, shouldShowBanner } = useInstallPrompt();

  if (!onboardingComplete) {
    if (showWelcome) {
      return <WelcomeScreen onStart={() => setShowWelcome(false)} />;
    }
    return <Onboarding onComplete={() => {}} />;
  }

  return (
    <AppShell>
      <AppContent />
      {/* بنر نصب PWA */}
      {shouldShowBanner() && (
        <div className="fixed bottom-24 left-4 right-4 z-50 max-w-lg mx-auto">
          <GlassCard level={3} className="flex items-center gap-3 p-4">
            <span className="text-2xl">📱</span>
            <div className="flex-1">
              <p className="text-sm font-medium">اسکای‌چی را نصب کن</p>
              <p className="text-xs text-text-secondary">دسترسی سریع‌تر، آفلاین</p>
            </div>
            <Button size="sm" onClick={promptInstall}>نصب</Button>
            <button onClick={dismissInstall} className="text-text-tertiary hover:text-text-secondary p-1">×</button>
          </GlassCard>
        </div>
      )}
    </AppShell>
  );
}

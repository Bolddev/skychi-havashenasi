import { useStore } from './store';
import { Onboarding } from './Onboarding';
import { WelcomeScreen } from './screens/Welcome';
import { AppShell } from './components/layout';
import { HomeScreen } from './screens/Home';
import { WeekPage } from './screens/Week';
import { ProfilesPage } from './ProfilesPage';
import { SettingsPage } from './SettingsPage';
import { useState } from 'react';

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

  if (!onboardingComplete) {
    if (showWelcome) {
      return <WelcomeScreen onStart={() => setShowWelcome(false)} />;
    }
    return <Onboarding onComplete={() => {}} />;
  }

  return (
    <AppShell>
      <AppContent />
    </AppShell>
  );
}

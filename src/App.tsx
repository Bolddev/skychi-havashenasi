import { useStore } from './store';
import { Onboarding } from './Onboarding';
import { AppShell } from './components/layout';
import { HomeScreen } from './screens/Home';
import { WeekPage } from './WeekPage';
import { ProfilesPage } from './ProfilesPage';
import { SettingsPage } from './SettingsPage';

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

  if (!onboardingComplete) {
    return <Onboarding onComplete={() => {}} />;
  }

  return (
    <AppShell>
      <AppContent />
    </AppShell>
  );
}

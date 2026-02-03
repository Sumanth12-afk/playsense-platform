// src/App.tsx
import { useState, useEffect } from 'react';
import { HealthScore } from './components/dashboard/HealthScore';
import { TodayActivity } from './components/dashboard/TodayActivity';
import { SessionTimer } from './components/dashboard/SessionTimer';
import { GamesList } from './components/dashboard/GamesList';
import { RewardsSection } from './components/dashboard/RewardsSection';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { OnboardingWizard } from './components/onboarding';
import { Button } from './components/ui/Button';
import { useStats } from './hooks/useStats';

type View = 'dashboard' | 'settings';
type AppState = 'loading' | 'onboarding' | 'ready';

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const { todayStats, gameStats, healthScore, currentSession, loading, refresh } =
    useStats();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      // Check if setup is complete
      const setupComplete = await window.electronAPI.getSetting('setup_complete');
      const childId = await window.electronAPI.getChildId();

      if (setupComplete === 'true' && childId) {
        setAppState('ready');
      } else {
        setAppState('onboarding');
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
      // Default to onboarding if there's an error
      setAppState('onboarding');
    }
  };

  const handleOnboardingComplete = () => {
    setAppState('ready');
  };

  // Show loading spinner while checking setup status
  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-primary-foreground">PS</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show onboarding wizard if not set up
  if (appState === 'onboarding') {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Custom Title Bar */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4 drag-region">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            PS
          </div>
          <h1 className="text-lg font-semibold">PlaySense Companion</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className={currentView === 'dashboard' ? 'bg-muted' : ''}
          >
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('settings')}
            className={currentView === 'settings' ? 'bg-muted' : ''}
          >
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        )}

        {!loading && currentView === 'dashboard' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Gaming Dashboard</h2>
                <p className="text-muted-foreground mt-1">
                  Monitor your gaming activity and health
                </p>
              </div>
              <Button onClick={refresh} variant="secondary">
                Refresh
              </Button>
            </div>

            {/* Health Score Section */}
            {healthScore && (
              <div className="flex justify-center py-8">
                <HealthScore healthScore={healthScore} />
              </div>
            )}

            {/* Current Session */}
            <SessionTimer session={currentSession} />

            {/* Rewards Section */}
            <RewardsSection />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {todayStats && <TodayActivity stats={todayStats} />}
              <GamesList games={gameStats.slice(0, 10)} />
            </div>
          </div>
        )}

        {!loading && currentView === 'settings' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold">Settings</h2>
              <p className="text-muted-foreground mt-1">
                Configure your PlaySense companion app
              </p>
            </div>
            <SettingsPanel />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;


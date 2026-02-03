// src/components/settings/SettingsPanel.tsx
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

export function SettingsPanel() {
  const [childId, setChildId] = useState('');
  const [savedChildId, setSavedChildId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  // Break reminder state
  const [breakReminderEnabled, setBreakReminderEnabled] = useState(true);
  const [breakReminderInterval, setBreakReminderInterval] = useState(60);
  const [isLoadingBreakSettings, setIsLoadingBreakSettings] = useState(true);

  useEffect(() => {
    loadSettings();
    loadBreakReminderSettings();
    
    // Auto-refresh sync status every 5 seconds
    const interval = setInterval(() => {
      refreshSyncStatus();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    try {
      const id = await window.electronAPI.getChildId();
      setSavedChildId(id);
      setChildId(id || '');

      await refreshSyncStatus();
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadBreakReminderSettings = async () => {
    try {
      setIsLoadingBreakSettings(true);
      const settings = await window.electronAPI.getBreakReminderSettings();
      setBreakReminderEnabled(settings.enabled);
      setBreakReminderInterval(settings.intervalMinutes);
    } catch (error) {
      console.error('Failed to load break reminder settings:', error);
    } finally {
      setIsLoadingBreakSettings(false);
    }
  };

  const handleBreakReminderToggle = async (enabled: boolean) => {
    setBreakReminderEnabled(enabled);
    await window.electronAPI.setBreakReminderSettings({ enabled });
  };

  const handleBreakIntervalChange = async (interval: number) => {
    setBreakReminderInterval(interval);
    await window.electronAPI.setBreakReminderSettings({ intervalMinutes: interval });
  };

  const handleTestBreakReminder = async () => {
    await window.electronAPI.testBreakReminder();
  };

  const refreshSyncStatus = async () => {
    try {
      const status = await window.electronAPI.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to refresh sync status:', error);
    }
  };

  const handleSave = async () => {
    if (!childId.trim()) return;

    setIsSaving(true);
    try {
      await window.electronAPI.setChildId(childId.trim());
      setSavedChildId(childId.trim());
      await loadSettings();
      alert('Child ID saved successfully!');
    } catch (error) {
      console.error('Failed to save child ID:', error);
      alert('Failed to save child ID');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndHide = async () => {
    if (!childId.trim()) return;

    setIsSaving(true);
    try {
      await window.electronAPI.setChildId(childId.trim());
      setSavedChildId(childId.trim());
      alert('Settings saved! App will now run in the background.\n\nClick the system tray icon to open the dashboard again.');
      
      // Hide window to tray after a short delay
      setTimeout(async () => {
        await window.electronAPI.hideToTray();
      }, 1000);
    } catch (error) {
      console.error('Failed to save child ID:', error);
      alert('Failed to save child ID');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    setIsTesting(true);
    try {
      const result = await window.electronAPI.triggerSync();
      if (result.success) {
        alert(`Synced ${result.synced} session(s) successfully!`);
        await refreshSyncStatus();
      } else {
        alert('Sync failed: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed');
    } finally {
      setIsTesting(false);
      await refreshSyncStatus();
    }
  };

  const handleTestConnection = async () => {
    if (!childId.trim()) {
      alert('Please enter a Child ID first');
      return;
    }
    
    setIsTesting(true);
    try {
      const result = await window.electronAPI.testConnection(childId.trim());
      if (result.connected) {
        alert(result.message || 'Connection successful!');
      } else {
        alert(result.message || 'Connection failed. Check your internet connection and Child ID.');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      alert('Connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Device Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Child ID
            </label>
            <input
              type="text"
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              placeholder="Enter child ID from parent dashboard"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Get this ID from your parent dashboard on the web app
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving || !childId.trim()}>
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button 
              onClick={handleSaveAndHide} 
              disabled={isSaving || !childId.trim()}
              variant="default"
            >
              💾 Save & Run in Background
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncStatus && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connection:</span>
                <span
                  className={
                    syncStatus.isOnline ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Device ID:</span>
                <span className="font-mono text-xs">{syncStatus.deviceId}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Device ID = this PC only. Points & rewards use Linked Child below.
              </p>
              {syncStatus.childId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linked Child (used for points):</span>
                  <span className="font-mono text-xs">{syncStatus.childId}</span>
                </div>
              )}
              {(syncStatus.totalSessions !== undefined || syncStatus.syncedSessions !== undefined || syncStatus.pendingSessions !== undefined) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Sync Progress:</span>
                    <span className="font-semibold">
                      {syncStatus.syncedSessions || 0}/{syncStatus.totalSessions || 0}
                    </span>
                  </div>
                  {syncStatus.pendingSessions !== undefined && syncStatus.pendingSessions > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending:</span>
                      <span className="text-yellow-600 font-semibold">
                        {syncStatus.pendingSessions} session(s) waiting to sync
                      </span>
                    </div>
                  )}
                  {syncStatus.pendingSessions === 0 && syncStatus.totalSessions !== undefined && syncStatus.totalSessions > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-green-600 font-semibold">
                        All synced ✓
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSync}
              disabled={isTesting || !savedChildId}
              size="sm"
            >
              {isTesting ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button
              onClick={handleTestConnection}
              disabled={isTesting}
              variant="secondary"
              size="sm"
            >
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Break Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Break Reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get gentle reminders to take breaks during long gaming sessions.
          </p>

          {isLoadingBreakSettings ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <>
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Break Reminders</p>
                  <p className="text-sm text-muted-foreground">
                    Show notifications to encourage breaks
                  </p>
                </div>
                <button
                  onClick={() => handleBreakReminderToggle(!breakReminderEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    breakReminderEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      breakReminderEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Interval Selection */}
              {breakReminderEnabled && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <p className="text-sm font-medium">Remind every:</p>
                  <div className="flex flex-wrap gap-2">
                    {[45, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => handleBreakIntervalChange(mins)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          breakReminderInterval === mins
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Button */}
              <div className="pt-4 border-t border-border">
                <Button
                  onClick={handleTestBreakReminder}
                  variant="secondary"
                  size="sm"
                >
                  Test Notification
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


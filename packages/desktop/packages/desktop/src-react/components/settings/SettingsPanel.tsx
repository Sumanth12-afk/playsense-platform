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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const id = await window.electronAPI.getChildId();
      setSavedChildId(id);
      setChildId(id || '');

      const status = await window.electronAPI.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load settings:', error);
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
        await loadSettings();
      } else {
        alert('Sync failed: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await window.electronAPI.testConnection();
      if (result.connected) {
        alert('Connection successful!');
      } else {
        alert('Connection failed. Check your internet connection.');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      alert('Connection test failed');
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
              {syncStatus.childId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linked Child:</span>
                  <span className="font-mono text-xs">{syncStatus.childId}</span>
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
    </div>
  );
}


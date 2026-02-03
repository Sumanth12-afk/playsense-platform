'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChildren } from '@/hooks/useChildren';
import { useAuth } from '@/hooks/useAuth';
import { AddChildDialog } from '@/components/dashboard/AddChildDialog';
import { ChildManagementCard } from '@/components/dashboard/ChildManagementCard';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Bell,
  Monitor,
  User,
  Shield,
  ChevronRight,
  Check,
  Copy,
  CheckCheck,
  Download,
  Loader2,
  Send,
  Save,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { COMPANION_APP_DOWNLOAD_URL } from '@/lib/constants';
import { toast } from 'sonner';

// Child Device Card with Copy ID functionality
const ChildDeviceCard = ({
  child,
}: {
  child: { id: string; name: string; last_sync_at: string | null };
}) => {
  const [copied, setCopied] = useState(false);

  const copyChildId = async () => {
    await navigator.clipboard.writeText(child.id);
    setCopied(true);
    toast.success('Child ID copied! Paste this in the companion app.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border p-4 mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              child.last_sync_at ? 'bg-health-green/10' : 'bg-muted'
            )}
          >
            <Monitor
              className={cn(
                'h-5 w-5',
                child.last_sync_at ? 'text-health-green' : 'text-muted-foreground'
              )}
            />
          </div>
          <div>
            <p className="font-medium text-foreground">{child.name}'s PC</p>
            <p className="text-sm text-muted-foreground">
              {child.last_sync_at
                ? `Last sync: ${new Date(child.last_sync_at).toLocaleDateString()}`
                : 'Not connected yet'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-2">
          Manage
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Child ID for Companion App */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Child ID for Companion App:</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-xs font-mono text-foreground truncate">
            {child.id}
          </code>
          <Button variant="outline" size="sm" onClick={copyChildId} className="gap-2 shrink-0">
            {copied ? (
              <>
                <CheckCheck className="h-4 w-4 text-health-green" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const { data: children, isLoading } = useChildren();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [weeklySendDay, setWeeklySendDay] = useState(0); // 0 = Sunday
  const [weeklySendTime, setWeeklySendTime] = useState('09:00');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingWeeklyTest, setIsSendingWeeklyTest] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Common timezones for selection
  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona (MST)' },
    { value: 'America/Anchorage', label: 'Alaska Time' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
    { value: 'UTC', label: 'UTC' },
  ];

  // Fetch email preferences from database
  const { data: emailPrefs, isLoading: isLoadingPrefs } = useQuery({
    queryKey: ['email-preferences', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.uid)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.uid,
  });

  // Update local state when preferences are loaded
  useEffect(() => {
    if (emailPrefs) {
      setWeeklyDigest(emailPrefs.weekly_enabled);
      if (emailPrefs.timezone) {
        setTimezone(emailPrefs.timezone);
      }
      if (emailPrefs.weekly_send_day !== undefined) {
        setWeeklySendDay(emailPrefs.weekly_send_day);
      }
      if (emailPrefs.weekly_send_time) {
        setWeeklySendTime(emailPrefs.weekly_send_time);
      }
    }
  }, [emailPrefs]);

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.uid || !user?.email) throw new Error('User not authenticated');

      const prefData = {
        user_id: user.uid,
        email: user.email,
        daily_enabled: false,
        timezone: timezone,
        weekly_enabled: weeklyDigest,
        weekly_send_day: weeklySendDay,
        weekly_send_time: weeklySendTime,
      };

      // Upsert the preferences
      const { error } = await supabase
        .from('email_preferences')
        .upsert(prefData, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-preferences'] });
      setHasChanges(false);
      toast.success('Email preferences saved! You will receive reports at your scheduled time.');
    },
    onError: (error) => {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    },
  });

  const handlePreferenceChange = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    value: any
  ) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSendTestEmail = async () => {
    if (!user?.email) {
      toast.error('No email address found');
      return;
    }
    setIsSendingTest(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: {
          email: user.email,
          parentName: user.displayName || user.email?.split('@')[0] || 'Parent',
        },
      });

      if (error) throw error;

      toast.success(
        `Test email sent to ${user.email}. Check your inbox and spam folder. (New domains may land in spam initially as we build email reputation.)`,
        { duration: 6000 }
      );
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(error.message || 'Failed to send test email. Please try again.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendTestWeeklyDigest = async () => {
    if (!user?.email) {
      toast.error('No email address found');
      return;
    }
    setIsSendingWeeklyTest(true);
    try {
      const res = await fetch('/api/send-weekly-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        emailsSent?: number;
        message?: string;
      };
      if (!res.ok) throw new Error(data.error || 'Request failed');
      const sent =
        data.emailsSent ??
        (data as { results?: { success?: boolean }[] }).results?.filter(
          (r: { success?: boolean }) => r.success
        ).length ??
        0;
      if (sent === 0) {
        toast.info(
          data.message ||
            'No weekly digest was sent. Enable Weekly Digest in Settings and ensure your child has gaming sessions this week.',
          { duration: 8000 }
        );
      } else {
        toast.success(
          `Weekly digest sent to ${user.email}. Check your inbox (and spam) for the real weekly update email.`,
          { duration: 6000 }
        );
      }
    } catch (error: any) {
      console.error('Error sending weekly digest:', error);
      toast.error(error?.message || 'Failed to send weekly digest. Try again.');
    } finally {
      setIsSendingWeeklyTest(false);
    }
  };

  const handleDownloadCompanion = () => {
    setIsDownloading(true);
    try {
      const downloadUrl = COMPANION_APP_DOWNLOAD_URL;

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'PlaySense-Setup.exe';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to start download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your preferences and connected devices</p>
      </motion.div>

      {/* Logged-in account */}
      {user?.email && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-card p-4 shadow-card border border-border"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Logged in as
              </p>
              <p className="text-sm font-medium text-foreground">{user.email}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Email Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card p-6 shadow-card"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Email Reports</h2>
            <p className="text-sm text-muted-foreground">Weekly digest</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Weekly Digest</p>
                <p className="text-sm text-muted-foreground">
                  Comprehensive weekly summary at your preferred time
                </p>
              </div>
              <Switch
                checked={weeklyDigest}
                onCheckedChange={(checked) => handlePreferenceChange(setWeeklyDigest, checked)}
                disabled={isLoadingPrefs}
              />
            </div>

            {/* Weekly Schedule Options */}
            {weeklyDigest && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-4"
              >
                {/* Send Day */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Send weekly digest on:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 0, label: 'Sunday' },
                      { value: 1, label: 'Monday' },
                      { value: 2, label: 'Tuesday' },
                      { value: 3, label: 'Wednesday' },
                      { value: 4, label: 'Thursday' },
                      { value: 5, label: 'Friday' },
                      { value: 6, label: 'Saturday' },
                    ].map((day) => (
                      <button
                        key={day.value}
                        onClick={() => handlePreferenceChange(setWeeklySendDay, day.value)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                          weeklySendDay === day.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        {weeklySendDay === day.value && <Check className="h-4 w-4" />}
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Send Time */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">At what time:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: '08:00', label: '8:00 AM' },
                      { value: '09:00', label: '9:00 AM' },
                      { value: '10:00', label: '10:00 AM' },
                      { value: '18:00', label: '6:00 PM' },
                      { value: '20:00', label: '8:00 PM' },
                    ].map((time) => (
                      <button
                        key={time.value}
                        onClick={() => handlePreferenceChange(setWeeklySendTime, time.value)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                          weeklySendTime === time.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        {weeklySendTime === time.value && <Check className="h-4 w-4" />}
                        {time.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timezone Selector */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bell className="h-4 w-4" />
                    <span>Your timezone:</span>
                  </div>
                  <select
                    value={timezone}
                    onChange={(e) => handlePreferenceChange(setTimezone, e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {timezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-xs text-muted-foreground">
                  Weekly digest will be sent every{' '}
                  {
                    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
                      weeklySendDay
                    ]
                  }{' '}
                  at{' '}
                  {weeklySendTime === '08:00'
                    ? '8:00 AM'
                    : weeklySendTime === '09:00'
                      ? '9:00 AM'
                      : weeklySendTime === '10:00'
                        ? '10:00 AM'
                        : weeklySendTime === '18:00'
                          ? '6:00 PM'
                          : '8:00 PM'}{' '}
                  ({timezone})
                </p>
                <div className="pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendTestWeeklyDigest}
                    disabled={isSendingWeeklyTest}
                    className="gap-2"
                  >
                    {isSendingWeeklyTest ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send test weekly digest now
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sends the real weekly update email to your inbox so you can see how it looks.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Save Preferences Button */}
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-border pt-6"
            >
              <Button
                onClick={() => savePreferencesMutation.mutate()}
                disabled={savePreferencesMutation.isPending}
                className="w-full gap-2"
              >
                {savePreferencesMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Email Preferences
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Test Email Button */}
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Test Email</p>
                <p className="text-sm text-muted-foreground">
                  Send a test email to verify your settings
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="gap-2"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Test
                  </>
                )}
              </Button>
            </div>
            <div className="mt-3 rounded-lg bg-muted/50 p-3 border border-border space-y-2">
              <p className="text-xs text-muted-foreground">
                📬 <strong>Not seeing emails?</strong>
              </p>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                <li>
                  Check <strong>Spam</strong> and <strong>Promotions</strong> tabs.
                </li>
                <li>Emails may take a few minutes to arrive.</li>
                <li>
                  Add PlaySense to your contacts or safe senders list so future digests land in your
                  inbox.
                </li>
                <li>Mark our emails as &quot;Not Spam&quot; to improve future deliverability.</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Connected Devices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-card p-6 shadow-card"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Monitor className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Connected Devices</h2>
            <p className="text-sm text-muted-foreground">Manage child's connected PCs</p>
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded-xl" />
          </div>
        ) : children && children.length > 0 ? (
          children.map((child) => <ChildDeviceCard key={child.id} child={child} />)
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No devices connected yet</p>
        )}

        <Button variant="outline" className="w-full">
          + Add Another Device
        </Button>
      </motion.div>

      {/* Child Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-card p-6 shadow-card"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Child Profile</h2>
            <p className="text-sm text-muted-foreground">Manage child's information</p>
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded-xl" />
          </div>
        ) : children && children.length > 0 ? (
          children.map((child) => <ChildManagementCard key={child.id} child={child} />)
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No children added yet</p>
        )}

        <AddChildDialog />
      </motion.div>

      {/* Companion App Download */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-card p-6 shadow-card"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Companion App</h2>
            <p className="text-sm text-muted-foreground">Download for Windows PC</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Install the PlaySense Companion app on your child's PC to track gaming activity. The app
          runs quietly in the background and syncs data automatically.
        </p>

        <Button onClick={handleDownloadCompanion} disabled={isDownloading} className="w-full gap-2">
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download PlaySense Companion
            </>
          )}
        </Button>
      </motion.div>

      {/* Privacy & Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl bg-primary-light p-6"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Our Privacy Promise</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              PlaySense only collects app/game usage data and time spent. We never:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-health-green" />
                Record keystrokes or screenshots
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-health-green" />
                Monitor chat messages or conversations
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-health-green" />
                View screens remotely or in real-time
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-health-green" />
                Block or control your child's device
              </li>
            </ul>
            <p className="mt-3 text-sm font-medium text-primary">
              We believe in insight, not intrusion.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;

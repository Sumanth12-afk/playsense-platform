import { motion } from 'framer-motion';
import { Monitor, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Child } from '@/hooks/useChildren';
import { cn } from '@/lib/utils';

interface DeviceStatusCardProps {
  child: Child;
}

export const DeviceStatusCard = ({ child }: DeviceStatusCardProps) => {
  const isConnected = !!child.last_sync_at;

  const timeSinceSync = () => {
    if (!child.last_sync_at) return 'Never synced';
    const diff = Date.now() - new Date(child.last_sync_at).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  // Consider device connected if synced within last hour
  const recentlyConnected =
    child.last_sync_at && Date.now() - new Date(child.last_sync_at).getTime() < 3600000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              recentlyConnected ? 'bg-health-green-bg' : 'bg-muted'
            )}
          >
            <Monitor
              className={cn(
                'h-5 w-5',
                recentlyConnected ? 'text-health-green' : 'text-muted-foreground'
              )}
            />
          </div>
          <div>
            <h4 className="font-medium text-foreground">{child.name}'s PC</h4>
            <p className="text-sm text-muted-foreground">{child.age_range} years old</p>
          </div>
        </div>

        <div
          className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1.5',
            recentlyConnected ? 'bg-health-green-bg' : 'bg-health-red-bg'
          )}
        >
          {recentlyConnected ? (
            <>
              <Wifi className="h-4 w-4 text-health-green" />
              <span className="text-xs font-medium text-health-green">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-health-red" />
              <span className="text-xs font-medium text-health-red">Offline</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Last sync</span>
        </div>
        <span className="text-sm font-medium text-foreground">{timeSinceSync()}</span>
      </div>
    </motion.div>
  );
};

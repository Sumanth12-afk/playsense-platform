import { motion } from 'framer-motion';
import { Moon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LateNightCardProps {
  thisWeek: number;
  trend: 'increasing' | 'stable' | 'decreasing' | 'up';
  lastSession: string | null;
}

const trendConfig = {
  increasing: {
    icon: TrendingUp,
    label: 'Increasing',
    description: 'Late-night gaming increased this week',
    className: 'text-health-yellow',
    bgClassName: 'bg-health-yellow-bg',
  },
  up: {
    icon: TrendingUp,
    label: 'Increasing',
    description: 'Late-night gaming increased this week',
    className: 'text-health-yellow',
    bgClassName: 'bg-health-yellow-bg',
  },
  stable: {
    icon: Minus,
    label: 'Stable',
    description: 'Late-night gaming is consistent',
    className: 'text-muted-foreground',
    bgClassName: 'bg-muted',
  },
  decreasing: {
    icon: TrendingDown,
    label: 'Decreasing',
    description: 'Late-night gaming decreased this week',
    className: 'text-health-green',
    bgClassName: 'bg-health-green-bg',
  },
};

export const LateNightCard = ({ thisWeek, trend, lastSession }: LateNightCardProps) => {
  const config = trendConfig[trend];
  const TrendIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Moon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Late Night Gaming</h3>
            <p className="text-sm text-muted-foreground">Sessions after 10 PM</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <span className="text-3xl font-bold text-foreground">{thisWeek}</span>
          <p className="mt-1 text-xs text-muted-foreground">Sessions this week</p>
        </div>
        
        <div className={cn('rounded-lg p-4 text-center', config.bgClassName)}>
          <div className="flex items-center justify-center gap-1">
            <TrendIcon className={cn('h-5 w-5', config.className)} />
            <span className={cn('text-lg font-semibold', config.className)}>{config.label}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">vs last week</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-muted/50 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Last late session: </span>
          {lastSession || 'No recent late sessions'}
        </p>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {config.description}. Late-night gaming can affect sleep quality and next-day focus.
      </p>
    </motion.div>
  );
};


import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeekdayWeekendCardProps {
  weekdayAvg: number;
  weekendAvg: number;
  difference: number;
}

export const WeekdayWeekendCard = ({
  weekdayAvg,
  weekendAvg,
  difference,
}: WeekdayWeekendCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Weekday vs Weekend</h3>
          <p className="text-sm text-muted-foreground">Average daily gaming time</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Weekday bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">School Days</span>
            <span className="text-sm font-semibold text-primary">{weekdayAvg.toFixed(1)}h</span>
          </div>
          <div className="h-4 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min((weekdayAvg / Math.max(weekdayAvg, weekendAvg)) * 100, 100)}%`,
              }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>

        {/* Weekend bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Weekends</span>
            <span className="text-sm font-semibold text-accent">{weekendAvg.toFixed(1)}h</span>
          </div>
          <div className="h-4 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min((weekendAvg / Math.max(weekdayAvg, weekendAvg)) * 100, 100)}%`,
              }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="h-full rounded-full bg-accent"
            />
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="mt-6 flex items-center justify-center gap-4 rounded-lg bg-muted/50 p-4">
        <div className="text-center">
          <span className="text-sm text-muted-foreground">Weekday</span>
          <p className="text-lg font-semibold text-foreground">{weekdayAvg.toFixed(1)}h</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="text-center">
          <span className="text-sm text-muted-foreground">Weekend</span>
          <p className="text-lg font-semibold text-foreground">{weekendAvg.toFixed(1)}h</p>
        </div>
        <div
          className={cn(
            'rounded-full px-3 py-1',
            difference > 1 ? 'bg-health-yellow-bg' : 'bg-health-green-bg'
          )}
        >
          <span
            className={cn(
              'text-sm font-semibold',
              difference > 1 ? 'text-health-yellow' : 'text-health-green'
            )}
          >
            +{Math.round(weekdayAvg > 0 ? (difference / weekdayAvg) * 100 : 0)}%
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {difference > 2
          ? 'Weekend gaming is significantly higher than weekdays. This is common, but large spikes may indicate catching up on gaming time.'
          : difference > 1
            ? 'Moderate increase on weekends, which is typical for most families.'
            : 'Gaming time is fairly consistent throughout the week.'}
      </p>
    </motion.div>
  );
};

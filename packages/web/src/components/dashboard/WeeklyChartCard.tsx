import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DayData {
  day: string;
  hours: number;
}

interface WeeklyChartCardProps {
  data: DayData[];
}

export const WeeklyChartCard = ({ data }: WeeklyChartCardProps) => {
  const maxHours = Math.max(...data.map(d => d.hours), 0.1);
  const avgHours = data.length ? data.reduce((acc, d) => acc + d.hours, 0) / data.length : 0;
  const weekendDays = ['Sat', 'Sun'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">This Week</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Average: {avgHours.toFixed(1)}h per day
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-2">
        {data.map((day, index) => {
          const height = maxHours > 0 ? (day.hours / maxHours) * 120 : 0;
          const isWeekend = weekendDays.includes(day.day);
          
          return (
            <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {day.hours > 0 ? `${day.hours.toFixed(1)}h` : '0'}
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: height }}
                transition={{ delay: 0.4 + index * 0.05, duration: 0.5, ease: 'easeOut' }}
                className={cn(
                  'w-full rounded-t-lg',
                  isWeekend ? 'bg-accent' : 'bg-primary'
                )}
                style={{ minHeight: day.hours > 0 ? 8 : 0 }}
              />
              <span className={cn(
                'text-xs font-medium',
                isWeekend ? 'text-accent-foreground' : 'text-muted-foreground'
              )}>
                {day.day}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-primary" />
          <span className="text-xs text-muted-foreground">Weekday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-accent" />
          <span className="text-xs text-muted-foreground">Weekend</span>
        </div>
      </div>
    </motion.div>
  );
};


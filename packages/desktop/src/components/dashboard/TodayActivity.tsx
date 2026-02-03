// src/components/dashboard/TodayActivity.tsx
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { DailyStats } from '@/types';
import { formatDuration } from '@/lib/utils';

interface TodayActivityProps {
  stats: DailyStats;
}

export function TodayActivity({ stats }: TodayActivityProps) {
  const categoryColors = {
    competitive: 'hsl(0, 70%, 60%)',
    creative: 'hsl(280, 60%, 60%)',
    casual: 'hsl(200, 70%, 55%)',
    social: 'hsl(145, 55%, 50%)',
  };

  const totalMinutes = stats.totalMinutes;
  const categories = Object.entries(stats.gamesByCategory);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total Time</span>
            <span className="text-2xl font-bold text-foreground">
              {formatDuration(totalMinutes)}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Sessions</span>
            <span className="text-lg font-semibold text-foreground">
              {stats.sessionCount}
            </span>
          </div>

          {categories.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">By Category</p>
              <div className="space-y-2">
                {categories.map(([category, minutes]) => {
                  const percentage = (minutes / totalMinutes) * 100;
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{category}</span>
                        <span className="font-medium">{formatDuration(minutes)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor:
                              categoryColors[category as keyof typeof categoryColors] ||
                              'hsl(240, 4%, 83%)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


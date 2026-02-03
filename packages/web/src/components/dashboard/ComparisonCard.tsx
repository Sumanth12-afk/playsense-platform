import { Card } from '@/components/ui/card';
import { useChildComparison } from '@/hooks/useSocialComparison';
import { TrendingUp, TrendingDown, Minus, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface ComparisonCardProps {
  childId: string;
}

export function ComparisonCard({ childId }: ComparisonCardProps) {
  const { data: comparison, isLoading } = useChildComparison(childId);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!comparison) return null;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getComparisonIcon = (childValue: number, avgValue: number) => {
    if (childValue > avgValue * 1.1) return <TrendingUp className="h-4 w-4 text-orange-500" />;
    if (childValue < avgValue * 0.9) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-foreground">Age Group Comparison</h3>
        </div>

        <div className="space-y-4">
          {/* Weekly Time Comparison */}
          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Weekly Gaming Time</p>
              <p className="text-lg font-semibold text-foreground">
                {formatTime(comparison.child_weekly_minutes)}
              </p>
              <p className="text-xs text-muted-foreground">
                vs {formatTime(comparison.avg_weekly_minutes)} average
              </p>
            </div>
            {getComparisonIcon(comparison.child_weekly_minutes, comparison.avg_weekly_minutes)}
          </div>

          {/* Health Score Comparison */}
          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Health Score</p>
              <p
                className={`text-lg font-semibold ${getHealthColor(comparison.child_health_score)}`}
              >
                {comparison.child_health_score}/100
              </p>
              <p className="text-xs text-muted-foreground">
                vs {comparison.avg_health_score}/100 average
              </p>
            </div>
            {getComparisonIcon(comparison.child_health_score, comparison.avg_health_score)}
          </div>

          {/* Session Count Comparison */}
          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Gaming Sessions</p>
              <p className="text-lg font-semibold text-foreground">
                {comparison.child_session_count}
              </p>
              <p className="text-xs text-muted-foreground">
                vs {comparison.avg_session_count} average
              </p>
            </div>
            {getComparisonIcon(comparison.child_session_count, comparison.avg_session_count)}
          </div>

          {/* Insights */}
          <div className="mt-4 p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
              📊 Insights
            </p>
            <ul className="space-y-1">
              {comparison.comparison_insights.map((insight, index) => (
                <li
                  key={index}
                  className="text-xs text-purple-800 dark:text-purple-200 flex items-start gap-2"
                >
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Percentile Display */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 bg-background/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Time Percentile</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {comparison.percentile_time}%
              </p>
            </div>
            <div className="p-3 bg-background/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Health Percentile</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {comparison.percentile_health}%
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Compared with anonymous data from children in the same age group
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

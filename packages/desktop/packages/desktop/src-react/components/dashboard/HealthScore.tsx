// src/components/dashboard/HealthScore.tsx
import { CircularProgress } from '../ui/CircularProgress';
import { HealthScore as HealthScoreType } from '@/types';

const statusColors = {
  healthy: 'hsl(145, 55%, 45%)',
  attention: 'hsl(45, 90%, 50%)',
  concern: 'hsl(0, 65%, 55%)',
};

const statusBgColors = {
  healthy: 'hsl(145, 55%, 94%)',
  attention: 'hsl(45, 90%, 94%)',
  concern: 'hsl(0, 65%, 95%)',
};

const statusLabels = {
  healthy: 'Healthy',
  attention: 'Needs Attention',
  concern: 'Concerning',
};

interface HealthScoreProps {
  healthScore: HealthScoreType;
}

export function HealthScore({ healthScore }: HealthScoreProps) {
  const { score, status } = healthScore;

  return (
    <div className="flex flex-col items-center">
      <CircularProgress
        value={score}
        size={128}
        strokeWidth={8}
        color={statusColors[status]}
        backgroundColor={statusBgColors[status]}
      >
        <span
          className="text-3xl font-bold"
          style={{ color: statusColors[status] }}
        >
          {score}
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
          Score
        </span>
      </CircularProgress>
      <div className="mt-4 text-center">
        <p className="text-lg font-semibold" style={{ color: statusColors[status] }}>
          {statusLabels[status]}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Gaming Health Status
        </p>
      </div>
    </div>
  );
}


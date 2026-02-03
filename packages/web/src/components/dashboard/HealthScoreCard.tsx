'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Activity, Clock, Moon, Gamepad2 } from 'lucide-react';
import { HealthScore } from '@playsense/shared';

interface Props {
  healthScore: HealthScore | null;
}

const statusConfig = {
  healthy: {
    label: 'Healthy',
    description: 'Gaming habits look balanced',
    bgClass: 'bg-health-green-bg',
    textClass: 'text-health-green',
    ringClass: 'ring-health-green',
  },
  attention: {
    label: 'Needs Attention',
    description: 'Some patterns could be improved',
    bgClass: 'bg-health-yellow-bg',
    textClass: 'text-health-yellow',
    ringClass: 'ring-health-yellow',
  },
  concern: {
    label: 'High Risk',
    description: 'Consider having a conversation',
    bgClass: 'bg-health-red-bg',
    textClass: 'text-health-red',
    ringClass: 'ring-health-red',
  },
};

const factorIcons: Record<string, any> = {
  session_length: Clock,
  break_frequency: Activity,
  late_night_usage: Moon,
  game_variety: Gamepad2,
};

const factorLabels: Record<string, string> = {
  session_length: 'Session Length',
  break_frequency: 'Break Frequency',
  late_night_usage: 'Late Night Usage',
  game_variety: 'Game Variety',
};

const factorStatus: Record<string, any> = {
  good: { label: 'Good', class: 'text-health-green bg-health-green-bg' },
  moderate: { label: 'Moderate', class: 'text-health-yellow bg-health-yellow-bg' },
  high: { label: 'High', class: 'text-health-red bg-health-red-bg' },
  low: { label: 'Low', class: 'text-health-yellow bg-health-yellow-bg' },
  minimal: { label: 'Minimal', class: 'text-health-green bg-health-green-bg' },
  frequent: { label: 'Frequent', class: 'text-health-red bg-health-red-bg' },
  watch: { label: 'Watch', class: 'text-health-yellow bg-health-yellow-bg' },
};

export const HealthScoreCard = ({ healthScore }: Props) => {
  if (!healthScore) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card p-6 shadow-card"
      >
        <h3 className="text-lg font-semibold text-foreground">Healthy Gaming Score</h3>
        <p className="mt-1 text-sm text-muted-foreground">No data available yet</p>
      </motion.div>
    );
  }

  const score = healthScore.overall;
  const status = score >= 70 ? 'healthy' : score >= 40 ? 'attention' : 'concern';
  const config = statusConfig[status];
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Get factor breakdown
  const factors = {
    session_length: healthScore.session_length,
    break_frequency: healthScore.break_frequency,
    late_night_usage: healthScore.late_night_usage,
    game_variety: healthScore.game_variety,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <h3 className="text-lg font-semibold text-foreground">Healthy Gaming Score</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Based on session patterns, not just total hours
      </p>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
        {/* Score Circle */}
        <div className="relative flex-shrink-0">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={config.textClass}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{
                strokeDasharray: circumference,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-3xl font-bold', config.textClass)}>{score}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>

        {/* Status & Factors */}
        <div className="flex-1">
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5',
              config.bgClass
            )}
          >
            <div className={cn('h-2 w-2 rounded-full', config.textClass, 'bg-current')} />
            <span className={cn('text-sm font-medium', config.textClass)}>{config.label}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{config.description}</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {Object.entries(factors).map(([key, value]) => {
              const Icon = factorIcons[key as keyof typeof factorIcons];
              const label = factorLabels[key as keyof typeof factorLabels];
              const statusInfo = factorStatus[value as keyof typeof factorStatus];

              return (
                <div key={key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">{label}:</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      statusInfo?.class || 'bg-muted'
                    )}
                  >
                    {statusInfo?.label || value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

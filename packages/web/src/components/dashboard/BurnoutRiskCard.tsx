import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BurnoutRisk {
  level: 'low' | 'medium' | 'high';
  description: string;
  factors: string[];
}

interface BurnoutRiskCardProps {
  risk: BurnoutRisk;
}

const riskConfig = {
  low: {
    label: 'Low Risk',
    color: 'text-health-green',
    bg: 'bg-health-green-bg',
    barColor: 'bg-health-green',
    level: 1,
  },
  medium: {
    label: 'Medium Risk',
    color: 'text-health-yellow',
    bg: 'bg-health-yellow-bg',
    barColor: 'bg-health-yellow',
    level: 2,
  },
  high: {
    label: 'High Risk',
    color: 'text-health-red',
    bg: 'bg-health-red-bg',
    barColor: 'bg-health-red',
    level: 3,
  },
};

export const BurnoutRiskCard = ({ risk }: BurnoutRiskCardProps) => {
  const config = riskConfig[risk.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', config.bg)}>
            <Flame className={cn('h-5 w-5', config.color)} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Burnout Risk</h3>
            <p className="text-sm text-muted-foreground">Based on session patterns</p>
          </div>
        </div>

        <div className={cn('rounded-full px-3 py-1.5', config.bg)}>
          <span className={cn('text-sm font-semibold', config.color)}>{config.label}</span>
        </div>
      </div>

      {/* Risk meter */}
      <div className="mt-6">
        <div className="flex gap-2">
          {[1, 2, 3].map((level) => (
            <motion.div
              key={level}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8 + level * 0.1 }}
              className={cn(
                'h-3 flex-1 rounded-full origin-left',
                level <= config.level ? config.barColor : 'bg-muted'
              )}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{risk.description}</p>

      <div className="mt-4 rounded-lg bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Factors: </span>
          {risk.factors.join(', ')}
        </p>
      </div>
    </motion.div>
  );
};

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameDominanceCardProps {
  gameName: string | null;
  percentage: number;
  isDominant: boolean;
}

export const GameDominanceCard = ({ gameName, percentage, isDominant }: GameDominanceCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={cn(
        'rounded-2xl p-6 shadow-card',
        isDominant ? 'bg-accent-light border border-accent/20' : 'bg-card'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Game Focus</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Most played game this week
          </p>
        </div>
        {isDominant && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
            <AlertTriangle className="h-4 w-4 text-accent" />
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold text-foreground">{gameName || 'No games yet'}</span>
          <span className={cn(
            'text-3xl font-bold',
            isDominant ? 'text-accent' : 'text-primary'
          )}>
            {percentage}%
          </span>
        </div>
        
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className={cn(
              'h-full rounded-full',
              isDominant ? 'bg-accent' : 'bg-primary'
            )}
          />
        </div>

        {isDominant ? (
          <div className="mt-4 rounded-lg bg-card p-3">
            <p className="text-sm text-foreground font-medium">
              One game dominates most sessions
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              While having a favorite game is normal, encouraging variety can help develop different skills and prevent over-attachment to a single game.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Gaming time is spread across multiple games, which is a healthy pattern.
          </p>
        )}
      </div>
    </motion.div>
  );
};

import { motion } from 'framer-motion';
import { Gamepad2, Clock, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Game {
  name: string;
  minutes: number;
  category: 'competitive' | 'creative' | 'casual' | 'social';
}

interface ActiveSession {
  game_name: string;
  category: 'competitive' | 'creative' | 'casual' | 'social';
  started_at: string;
}

interface TodayActivityCardProps {
  games: Game[];
  totalMinutes: number;
  activeSession?: ActiveSession | null;  // Currently playing game
}


const categoryColors = {
  competitive: 'bg-category-competitive',
  creative: 'bg-category-creative',
  casual: 'bg-category-casual',
  social: 'bg-category-social',
};

const categoryLabels = {
  competitive: 'Competitive',
  creative: 'Creative',
  casual: 'Casual',
  social: 'Social',
};

export const TodayActivityCard = ({ games, totalMinutes, activeSession }: TodayActivityCardProps) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeDisplay = hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m`;

  // Calculate active session duration
  const getActiveSessionDuration = () => {
    if (!activeSession) return '';
    const startTime = new Date(activeSession.started_at);
    const now = new Date();
    const durationMs = now.getTime() - startTime.getTime();
    const durationMins = Math.floor(durationMs / 60000);
    const hrs = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Today's Activity</h3>
        <div className="flex items-center gap-2 rounded-full bg-primary-light px-3 py-1.5">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">{timeDisplay}</span>
        </div>
      </div>

      {/* REAL-TIME: Currently Playing Indicator */}
      {activeSession && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 rounded-xl bg-green-500/10 border border-green-500/30 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <div className="absolute inset-0 h-3 w-3 rounded-full bg-green-500 animate-ping opacity-75" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-green-700 dark:text-green-400">
                  🎮 Currently Playing
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-500">
                  {getActiveSessionDuration()}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Play className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800 dark:text-green-300">
                  {activeSession.game_name}
                </span>
                <span className="text-xs text-green-600/70 dark:text-green-400/70">
                  ({categoryLabels[activeSession.category]})
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-6 space-y-4">
        {games.length === 0 && !activeSession ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Gamepad2 className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No gaming activity yet today</p>
          </div>
        ) : (

          games.map((game, index) => (
            <motion.div
              key={game.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className={cn('h-10 w-1 rounded-full', categoryColors[game.category])} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{game.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.floor(game.minutes / 60) > 0 && `${Math.floor(game.minutes / 60)}h `}
                    {game.minutes % 60}m
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {categoryLabels[game.category]}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Time bar visualization */}
      {games.length > 0 && (
        <div className="mt-6">
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            {games.map((game, index) => (
              <motion.div
                key={game.name}
                initial={{ width: 0 }}
                animate={{ width: `${(game.minutes / totalMinutes) * 100}%` }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                className={cn(categoryColors[game.category])}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {games.map((game) => (
              <div key={game.name} className="flex items-center gap-1.5">
                <div className={cn('h-2 w-2 rounded-full', categoryColors[game.category])} />
                <span className="text-xs text-muted-foreground">{game.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

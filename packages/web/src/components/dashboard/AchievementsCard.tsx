'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  useAchievements, 
  groupAchievementsByCategory, 
  calculateTotalPoints,
  getProgressPercentage,
  Achievement
} from '@/hooks/useAchievements';
import { Trophy, Star, Lock, ChevronRight, Sparkles } from 'lucide-react';

interface AchievementsCardProps {
  childId: string;
  childName: string;
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  health: { label: 'Health', color: 'text-green-500' },
  variety: { label: 'Variety', color: 'text-purple-500' },
  balance: { label: 'Balance', color: 'text-blue-500' },
  social: { label: 'Social', color: 'text-pink-500' },
  milestone: { label: 'Milestones', color: 'text-yellow-500' },
};

function AchievementBadge({ achievement, compact = false }: { achievement: Achievement; compact?: boolean }) {
  const progress = getProgressPercentage(achievement);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-xl border p-3 transition-all ${
        achievement.is_earned 
          ? 'border-primary/50 bg-primary/5 hover:bg-primary/10' 
          : 'border-border bg-muted/30 opacity-70 hover:opacity-100'
      }`}
    >
      {/* Earned indicator */}
      {achievement.is_earned && (
        <div className="absolute -top-1 -right-1">
          <div className="bg-primary rounded-full p-1">
            <Star className="h-3 w-3 text-primary-foreground fill-current" />
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`text-2xl ${achievement.is_earned ? '' : 'grayscale opacity-50'}`}>
          {achievement.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium text-sm ${achievement.is_earned ? 'text-foreground' : 'text-muted-foreground'}`}>
              {achievement.name}
            </h4>
            {achievement.times_earned > 1 && (
              <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                x{achievement.times_earned}
              </span>
            )}
          </div>
          
          {!compact && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {achievement.description}
            </p>
          )}

          {/* Progress bar (for unearned) */}
          {!achievement.is_earned && progress > 0 && (
            <div className="mt-2">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/50 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {achievement.current_progress}/{achievement.requirement_value}
              </p>
            </div>
          )}

          {/* Points */}
          <div className="flex items-center gap-1 mt-1">
            <Sparkles className="h-3 w-3 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-600">
              {achievement.points} pts
            </span>
            {achievement.is_earned && achievement.earned_at && (
              <span className="text-xs text-muted-foreground ml-2">
                Earned {new Date(achievement.earned_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AchievementsCard({ childId, childName }: AchievementsCardProps) {
  const { data: achievements, isLoading } = useAchievements(childId);
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading achievements...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Achievements will appear here as {childName} maintains healthy gaming habits!
          </p>
        </CardContent>
      </Card>
    );
  }

  const grouped = groupAchievementsByCategory(achievements);
  const totalPoints = calculateTotalPoints(achievements);
  const earnedCount = achievements.filter(a => a.is_earned).length;
  
  // Get recently earned (last 7 days)
  const recentlyEarned = achievements
    .filter(a => a.is_earned && a.earned_at)
    .filter(a => new Date(a.earned_at!).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000)
    .slice(0, 3);

  // Get close to earning (progress > 50%)
  const closeToEarning = achievements
    .filter(a => !a.is_earned && getProgressPercentage(a) >= 50)
    .slice(0, 3);

  const displayAchievements = selectedCategory 
    ? grouped[selectedCategory] || []
    : showAll 
      ? achievements 
      : [...recentlyEarned, ...closeToEarning.filter(a => !recentlyEarned.find(r => r.id === a.id))].slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-sm font-medium">
              <Sparkles className="h-3 w-3 inline mr-1" />
              {totalPoints} pts
            </div>
            <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {earnedCount}/{achievements.length}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {Object.entries(categoryLabels).map(([key, { label, color }]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              className={selectedCategory !== key ? color : ''}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Achievement Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {displayAchievements.map((achievement) => (
              <AchievementBadge 
                key={achievement.id} 
                achievement={achievement} 
                compact={!showAll && !selectedCategory}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Show More/Less */}
        {!selectedCategory && achievements.length > 6 && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : `Show All ${achievements.length} Achievements`}
            <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showAll ? 'rotate-90' : ''}`} />
          </Button>
        )}

        {/* Encouragement */}
        {closeToEarning.length > 0 && !showAll && !selectedCategory && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-sm text-foreground font-medium">
              Almost there!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {childName} is close to earning: {closeToEarning.map(a => a.name).join(', ')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

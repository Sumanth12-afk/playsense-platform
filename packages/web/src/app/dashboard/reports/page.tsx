'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { WeeklyChartCard } from '@/components/dashboard/WeeklyChartCard';
import { Calendar, Download, ChevronLeft, ChevronRight, Clock, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChildren } from '@/hooks/useChildren';
import { useWeeklyStats, useGamingSessions } from '@/hooks/useGamingData';
import { ChildSelector } from '@/components/dashboard/ChildSelector';
import { EmptyState } from '@/components/dashboard/EmptyState';

const categoryColors: Record<string, string> = {
  competitive: 'bg-category-competitive',
  creative: 'bg-category-creative',
  casual: 'bg-category-casual',
  social: 'bg-category-social',
  other: 'bg-muted-foreground',
};

const categoryLabels: Record<string, string> = {
  competitive: 'Competitive',
  creative: 'Creative',
  casual: 'Casual',
  social: 'Social',
  other: 'Other',
};

const ReportsPage = () => {
  const { data: children, isLoading: childrenLoading } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');

  // Auto-select first child if none selected
  const activeChildId = selectedChildId || children?.[0]?.id;
  const activeChild = children?.find(c => c.id === activeChildId);

  const { data: weeklyStats, isLoading: weeklyLoading } = useWeeklyStats(activeChildId);
  const { data: sessions, isLoading: sessionsLoading } = useGamingSessions(activeChildId);

  // Group sessions by date
  const groupedSessions = sessions?.reduce((acc, session) => {
    const date = new Date(session.started_at).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>) || {};

  // Convert grouped sessions to daily reports
  const recentDays = Object.entries(groupedSessions)
    .slice(0, 7) // Show last 7 days with data
    .map(([date, daySessions]) => {
      const games = daySessions.reduce((acc, session) => {
        const gameName = session.game?.name || 'Unknown Game';
        const category = session.game?.category || 'other';
        const existing = acc.find(g => g.name === gameName);
        
        if (existing) {
          existing.minutes += session.duration_minutes || 0;
        } else {
          acc.push({
            name: gameName,
            minutes: session.duration_minutes || 0,
            category: category as 'competitive' | 'creative' | 'casual' | 'social',
          });
        }
        return acc;
      }, [] as { name: string; minutes: number; category: string }[]);

      const total = games.reduce((sum, g) => sum + g.minutes, 0);
      
      // Format date for display
      const isToday = new Date(daySessions[0].started_at).toDateString() === new Date().toDateString();
      const isYesterday = new Date(daySessions[0].started_at).toDateString() === 
        new Date(Date.now() - 86400000).toDateString();
      
      return {
        date: isToday ? 'Today' : isYesterday ? 'Yesterday' : date,
        games,
        total,
      };
    });

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Reports
          </h1>
          <p className="mt-2 text-muted-foreground">
            {activeChild ? `${activeChild.name}'s gaming activity history` : 'Detailed gaming activity history'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {children.length > 1 && (
            <ChildSelector 
              children={children}
              selectedId={activeChildId}
              onSelect={setSelectedChildId}
            />
          )}
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </motion.div>

      {/* Period Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2"
      >
        {(['today', 'week', 'month'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-all',
              selectedPeriod === period
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Weekly Overview */}
      {weeklyLoading ? (
        <div className="rounded-2xl bg-card p-6 shadow-card animate-pulse">
          <div className="h-48 bg-muted rounded"></div>
        </div>
      ) : (
        <WeeklyChartCard data={weeklyStats || []} />
      )}

      {/* Date Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-lg font-semibold text-foreground">Daily Breakdown</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">This Week</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Daily Reports */}
      <div className="space-y-4">
        {sessionsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-card p-5 shadow-card animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded"></div>
                      <div className="h-3 w-16 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="h-8 w-20 bg-muted rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentDays.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-8 shadow-card text-center"
          >
            <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No gaming sessions recorded yet. Sessions will appear here once the companion app syncs data.
            </p>
          </motion.div>
        ) : (
          recentDays.map((day, index) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="rounded-2xl bg-card p-5 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{day.date}</h3>
                    <p className="text-sm text-muted-foreground">
                      {day.games.length} game{day.games.length !== 1 ? 's' : ''} played
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-primary-light px-3 py-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {Math.floor(day.total / 60)}h {day.total % 60}m
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {day.games.map((game) => (
                  <div key={game.name} className="flex items-center gap-3">
                    <div className={cn('h-8 w-1 rounded-full', categoryColors[game.category] || 'bg-muted-foreground')} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{game.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.floor(game.minutes / 60) > 0 && `${Math.floor(game.minutes / 60)}h `}
                          {game.minutes % 60}m
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {categoryLabels[game.category] || 'Other'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportsPage;

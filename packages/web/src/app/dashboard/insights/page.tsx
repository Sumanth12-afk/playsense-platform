'use client';

import { motion } from 'framer-motion';
import { CategoryBreakdownCard } from '@/components/dashboard/CategoryBreakdownCard';
import { GameDominanceCard } from '@/components/dashboard/GameDominanceCard';
import { LateNightCard } from '@/components/dashboard/LateNightCard';
import { BurnoutRiskCard } from '@/components/dashboard/BurnoutRiskCard';
import { WeekdayWeekendCard } from '@/components/dashboard/WeekdayWeekendCard';
import { useCategoryBreakdown, useGameDominance, useLateNightSessions, useWeeklyStats } from '@/hooks/useGamingData';
import { useChildren } from '@/hooks/useChildren';
import { Sparkles, Info } from 'lucide-react';

const InsightsPage = () => {
  const { data: children } = useChildren();
  const activeChildId = children?.[0]?.id;

  const { data: categoryData } = useCategoryBreakdown(activeChildId);
  const { data: gameDominance } = useGameDominance(activeChildId);
  const { data: lateNightData } = useLateNightSessions(activeChildId);
  const { data: weeklyStats } = useWeeklyStats(activeChildId);

  const weekdayWeekend = (() => {
    if (!weeklyStats) return { weekdayAvg: 0, weekendAvg: 0, difference: 0 };
    const weekdays = weeklyStats.filter(d => !['Sat', 'Sun'].includes(d.day));
    const weekends = weeklyStats.filter(d => ['Sat', 'Sun'].includes(d.day));
    const weekdayAvg = weekdays.length ? weekdays.reduce((sum, d) => sum + d.hours, 0) / weekdays.length : 0;
    const weekendAvg = weekends.length ? weekends.reduce((sum, d) => sum + d.hours, 0) / weekends.length : 0;
    return { weekdayAvg: Math.round(weekdayAvg * 10) / 10, weekendAvg: Math.round(weekendAvg * 10) / 10, difference: Math.round((weekendAvg - weekdayAvg) * 10) / 10 };
  })();

  const burnoutRisk: { level: 'low' | 'medium' | 'high'; description: string; factors: string[] } = (() => {
    const weeklyHours = weeklyStats?.reduce((sum, d) => sum + d.hours, 0) || 0;
    const lateNightCount = lateNightData?.count || 0;
    if (weeklyHours > 35 || lateNightCount > 5) return { level: 'high', description: 'Extended sessions detected', factors: ['Long sessions', 'Late-night gaming'] };
    if (weeklyHours > 21 || lateNightCount > 2) return { level: 'medium', description: 'Some patterns may need attention', factors: ['Moderate session lengths'] };
    return { level: 'low', description: 'Gaming patterns appear balanced', factors: ['Regular breaks'] };
  })();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Insights</h1>
        <p className="mt-2 text-muted-foreground">Deeper analysis of gaming patterns and behaviors</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-start gap-4 rounded-2xl border border-primary/20 bg-primary-light p-5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">This Week&apos;s Key Insight</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {gameDominance?.isDominant
              ? `${gameDominance.topGame} dominates ${gameDominance.percentage}% of gaming time.`
              : 'Gaming patterns look balanced this week.'}
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
        <Info className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">These insights are generated automatically based on detected patterns.</p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryBreakdownCard data={categoryData || []} />
        <GameDominanceCard gameName={gameDominance?.topGame || null} percentage={gameDominance?.percentage || 0} isDominant={gameDominance?.isDominant || false} />
      </div>

      <h2 className="text-lg font-semibold text-foreground mt-8">Health Patterns</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <LateNightCard thisWeek={lateNightData?.count || 0} trend={lateNightData && lateNightData.count > 2 ? 'up' : 'stable'} lastSession={lateNightData?.sessions[0]?.ended_at ? new Date(lateNightData.sessions[0].ended_at).toLocaleDateString('en-US', { weekday: 'long' }) : null} />
        <BurnoutRiskCard risk={burnoutRisk} />
      </div>

      <h2 className="text-lg font-semibold text-foreground mt-8">Schedule Patterns</h2>
      <WeekdayWeekendCard {...weekdayWeekend} />
    </div>
  );
};

export default InsightsPage;

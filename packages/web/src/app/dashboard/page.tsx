'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import { TodayActivityCard } from '@/components/dashboard/TodayActivityCard';
import { WeeklyChartCard } from '@/components/dashboard/WeeklyChartCard';
import { DeviceStatusCard } from '@/components/dashboard/DeviceStatusCard';
import { CategoryBreakdownCard } from '@/components/dashboard/CategoryBreakdownCard';
import { GameDominanceCard } from '@/components/dashboard/GameDominanceCard';
import { LateNightCard } from '@/components/dashboard/LateNightCard';
import { BurnoutRiskCard } from '@/components/dashboard/BurnoutRiskCard';
import { WeekdayWeekendCard } from '@/components/dashboard/WeekdayWeekendCard';
import { ConversationGuidanceCard } from '@/components/dashboard/ConversationGuidanceCard';
import { ChildSelector } from '@/components/dashboard/ChildSelector';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ComparisonCard } from '@/components/dashboard/ComparisonCard';
import { RewardsCard } from '@/components/dashboard/RewardsCard';
import { PendingRedemptionsCard } from '@/components/dashboard/PendingRedemptionsCard';
import { AllChildrenOverview } from '@/components/dashboard/AllChildrenOverview';
import { AchievementsCard } from '@/components/dashboard/AchievementsCard';
import { SessionNotesCard } from '@/components/dashboard/SessionNotesCard';
import { useChildren } from '@/hooks/useChildren';
import {
  useTodayActivity,
  useWeeklyStats,
  useCategoryBreakdown,
  useLateNightSessions,
  useGameDominance,
  useActiveSession,
} from '@/hooks/useGamingData';
import { useConversationTips, transformTipsForCard } from '@/hooks/useConversationTips';

export default function DashboardPage() {
  const { data: children, isLoading: childrenLoading, error: childrenError } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>();

  // Check if "All Children" is selected
  const isAllChildrenView = selectedChildId === 'all';

  // Auto-select first child if none selected (only if not showing all)
  const activeChildId = isAllChildrenView ? undefined : selectedChildId || children?.[0]?.id;
  const activeChild = activeChildId ? children?.find((c) => c.id === activeChildId) : undefined;

  // Debug logging
  console.log('Dashboard - Children:', children);
  console.log('Dashboard - Loading:', childrenLoading);
  console.log('Dashboard - Error:', childrenError);

  const { data: todayActivity } = useTodayActivity(activeChildId);
  const { data: weeklyStats } = useWeeklyStats(activeChildId);
  const { data: categoryBreakdown } = useCategoryBreakdown(activeChildId);
  const { data: lateNightData } = useLateNightSessions(activeChildId);
  const { data: gameDominance } = useGameDominance(activeChildId);
  const { data: activeSession } = useActiveSession(activeChildId); // REAL-TIME: Currently playing game
  const { data: conversationTips } = useConversationTips();

  // Debug logging to help troubleshoot real-time updates
  console.log('Dashboard - activeChildId:', activeChildId);
  console.log('Dashboard - todayActivity:', todayActivity);
  console.log('Dashboard - activeSession:', activeSession);

  const conversationGuidance = transformTipsForCard(conversationTips);

  // Calculate today's games from sessions
  const todayGames =
    todayActivity?.reduce(
      (acc, session) => {
        const existing = acc.find((g) => g.name === session.game?.name);
        if (existing) {
          existing.minutes += session.duration_minutes;
        } else if (session.game) {
          acc.push({
            name: session.game.name,
            minutes: session.duration_minutes,
            category: session.game.category,
          });
        }
        return acc;
      },
      [] as {
        name: string;
        minutes: number;
        category: 'competitive' | 'creative' | 'casual' | 'social';
      }[]
    ) || [];

  const totalMinutes = todayGames.reduce((acc, g) => acc + g.minutes, 0);

  // Calculate health score based on real data
  const calculateHealthScore = () => {
    let score = 100;
    const factors: {
      session_length: string;
      break_frequency: string;
      late_night_usage: string;
      game_variety: string;
    } = {
      session_length: 'good',
      break_frequency: 'good',
      late_night_usage: 'minimal',
      game_variety: 'good',
    };

    // Late night penalty
    if (lateNightData && lateNightData.count > 0) {
      score -= lateNightData.count * 5;
      factors.late_night_usage = lateNightData.count > 3 ? 'frequent' : 'moderate';
    }

    // Game dominance penalty
    if (gameDominance?.isDominant) {
      score -= 10;
      factors.game_variety = 'low';
    }

    // Long sessions penalty
    const avgDailyHours = weeklyStats?.reduce((sum, d) => sum + d.hours, 0) || 0;
    if (avgDailyHours > 28) {
      score -= 15;
      factors.session_length = 'high';
    } else if (avgDailyHours > 21) {
      score -= 8;
      factors.session_length = 'moderate';
    }

    score = Math.max(0, Math.min(100, score));

    return {
      overall: score,
      session_length: factors.session_length,
      break_frequency: factors.break_frequency,
      late_night_usage: factors.late_night_usage,
      game_variety: factors.game_variety,
    };
  };

  const healthScore = calculateHealthScore();

  // Calculate burnout risk
  const calculateBurnoutRisk = () => {
    const weeklyHours = weeklyStats?.reduce((sum, d) => sum + d.hours, 0) || 0;
    const lateNightCount = lateNightData?.count || 0;

    if (weeklyHours > 35 || lateNightCount > 5) {
      return {
        level: 'high' as const,
        description: 'Extended sessions and late-night gaming detected',
        factors: ['Long daily sessions', 'Frequent late-night gaming', 'Limited breaks'],
      };
    } else if (weeklyHours > 21 || lateNightCount > 2) {
      return {
        level: 'medium' as const,
        description: 'Some patterns may need attention',
        factors: ['Moderate session lengths', 'Occasional late-night sessions'],
      };
    }
    return {
      level: 'low' as const,
      description: 'Gaming patterns appear balanced',
      factors: ['Regular breaks', 'Reasonable session lengths'],
    };
  };

  // Calculate weekday vs weekend comparison
  const calculateWeekdayWeekend = () => {
    if (!weeklyStats) return { weekdayAvg: 0, weekendAvg: 0, difference: 0 };

    const weekdays = weeklyStats.filter((d) => !['Sat', 'Sun'].includes(d.day));
    const weekends = weeklyStats.filter((d) => ['Sat', 'Sun'].includes(d.day));

    const weekdayAvg = weekdays.length
      ? weekdays.reduce((sum, d) => sum + d.hours, 0) / weekdays.length
      : 0;
    const weekendAvg = weekends.length
      ? weekends.reduce((sum, d) => sum + d.hours, 0) / weekends.length
      : 0;

    return {
      weekdayAvg: Math.round(weekdayAvg * 10) / 10,
      weekendAvg: Math.round(weekendAvg * 10) / 10,
      difference: Math.round((weekendAvg - weekdayAvg) * 10) / 10,
    };
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">{getGreeting()} 👋</h1>
          <p className="text-muted-foreground">
            {isAllChildrenView
              ? `Overview of all ${children.length} children`
              : activeChild
                ? `Here's how ${activeChild.name}'s gaming looks this week`
                : 'Select a child to view insights'}
          </p>
        </div>
        {children.length > 1 && (
          <ChildSelector
            children={children}
            selectedId={selectedChildId || activeChildId}
            onSelect={setSelectedChildId}
            showAllOption={true}
          />
        )}
      </motion.div>

      {/* All Children Overview */}
      {isAllChildrenView && children.length > 0 && (
        <AllChildrenOverview
          children={children}
          onSelectChild={(childId) => setSelectedChildId(childId)}
        />
      )}

      {/* Single Child View */}
      {!isAllChildrenView && activeChild && (
        <>
          {/* Device Status */}
          <DeviceStatusCard child={activeChild} />

          {/* Main Stats Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <HealthScoreCard healthScore={healthScore} />
            <TodayActivityCard
              games={todayGames}
              totalMinutes={totalMinutes}
              activeSession={
                activeSession
                  ? {
                      game_name: activeSession.game?.name || 'Unknown Game',
                      category: activeSession.game?.category || 'casual',
                      started_at: activeSession.started_at,
                    }
                  : null
              }
            />
          </div>

          {/* Weekly Chart */}
          <WeeklyChartCard data={weeklyStats || []} />

          {/* Insights Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryBreakdownCard data={categoryBreakdown || []} />
            <GameDominanceCard
              gameName={gameDominance?.topGame || null}
              percentage={gameDominance?.percentage || 0}
              isDominant={gameDominance?.isDominant || false}
            />
          </div>

          {/* Social Comparison */}
          {activeChildId && <ComparisonCard childId={activeChildId} />}

          {/* Rewards System */}
          {activeChildId && activeChild && (
            <RewardsCard childId={activeChildId} childName={activeChild.name} />
          )}

          {/* Achievements */}
          {activeChildId && activeChild && (
            <AchievementsCard childId={activeChildId} childName={activeChild.name} />
          )}

          {/* Pending Redemptions (Parent Approval) */}
          <PendingRedemptionsCard />

          {/* Health Indicators */}
          <div className="grid gap-6 lg:grid-cols-3">
            <LateNightCard
              thisWeek={lateNightData?.count || 0}
              trend={lateNightData && lateNightData.count > 2 ? 'up' : 'stable'}
              lastSession={
                lateNightData?.sessions[0]?.ended_at
                  ? new Date(lateNightData.sessions[0].ended_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                    })
                  : null
              }
            />
            <BurnoutRiskCard risk={calculateBurnoutRisk()} />
            <WeekdayWeekendCard {...calculateWeekdayWeekend()} />
          </div>

          {/* Session Notes */}
          {activeChildId && activeChild && (
            <SessionNotesCard
              childId={activeChildId}
              childName={activeChild.name}
              recentSessions={todayActivity?.map((s) => ({
                id: s.id,
                game: s.game,
                started_at: s.started_at,
                duration_minutes: s.duration_minutes,
                parent_note: (s as any).parent_note,
              }))}
            />
          )}

          {/* Conversation Guidance */}
          <ConversationGuidanceCard tips={conversationGuidance} compact />
        </>
      )}

      {/* Pending Redemptions always visible (for all children) */}
      {isAllChildrenView && <PendingRedemptionsCard />}
    </div>
  );
}

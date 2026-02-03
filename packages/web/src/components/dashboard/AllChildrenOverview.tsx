'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Child } from '@/hooks/useChildren';
import { supabase } from '@/lib/supabase';
import { Activity, Clock, GamepadIcon, TrendingUp, TrendingDown, Moon, Users } from 'lucide-react';

interface AllChildrenOverviewProps {
  children: Child[];
  onSelectChild: (childId: string) => void;
}

interface ChildStats {
  childId: string;
  childName: string;
  todayMinutes: number;
  weeklyMinutes: number;
  topGame: string | null;
  lateNightCount: number;
  lastActive: string | null;
  healthScore: number;
}

export function AllChildrenOverview({ children, onSelectChild }: AllChildrenOverviewProps) {
  const [childStats, setChildStats] = useState<ChildStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllChildrenStats();
  }, [children]);

  const fetchAllChildrenStats = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const stats: ChildStats[] = [];

    for (const child of children) {
      try {
        // Get today's activity
        const { data: todaySessions } = await supabase
          .from('gaming_sessions')
          .select('duration_minutes')
          .eq('child_id', child.id)
          .gte('started_at', today.toISOString());

        const todayMinutes = (todaySessions || []).reduce((sum, s) => sum + s.duration_minutes, 0);

        // Get weekly activity
        const { data: weeklySessions } = await supabase
          .from('gaming_sessions')
          .select('duration_minutes, started_at, ended_at, game:games(name)')
          .eq('child_id', child.id)
          .gte('started_at', weekAgo.toISOString());

        const weeklyMinutes = (weeklySessions || []).reduce(
          (sum, s) => sum + s.duration_minutes,
          0
        );

        // Get top game
        const gameTime: Record<string, number> = {};
        (weeklySessions || []).forEach((session: any) => {
          if (session.game?.name) {
            gameTime[session.game.name] =
              (gameTime[session.game.name] || 0) + session.duration_minutes;
          }
        });
        const topGameEntry = Object.entries(gameTime).sort((a, b) => b[1] - a[1])[0];
        const topGame = topGameEntry ? topGameEntry[0] : null;

        // Get late night count
        const lateNightCount = (weeklySessions || []).filter((s: any) => {
          if (!s.ended_at) return false;
          const hour = new Date(s.ended_at).getHours();
          return hour >= 22 || hour < 6;
        }).length;

        // Get last active
        const lastSession = (weeklySessions || []).sort(
          (a: any, b: any) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        )[0];
        const lastActive = lastSession?.started_at || null;

        // Calculate health score
        let healthScore = 100;
        if (weeklyMinutes > 1260) healthScore -= 20; // >21 hours/week
        if (lateNightCount > 3) healthScore -= 15;
        if (topGame && gameTime[topGame] / weeklyMinutes > 0.7) healthScore -= 10;
        healthScore = Math.max(0, healthScore);

        stats.push({
          childId: child.id,
          childName: child.name,
          todayMinutes,
          weeklyMinutes,
          topGame,
          lateNightCount,
          lastActive,
          healthScore,
        });
      } catch (error) {
        console.error(`Error fetching stats for ${child.name}:`, error);
        stats.push({
          childId: child.id,
          childName: child.name,
          todayMinutes: 0,
          weeklyMinutes: 0,
          topGame: null,
          lateNightCount: 0,
          lastActive: null,
          healthScore: 100,
        });
      }
    }

    setChildStats(stats);
    setLoading(false);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  // Calculate totals
  const totalTodayMinutes = childStats.reduce((sum, s) => sum + s.todayMinutes, 0);
  const totalWeeklyMinutes = childStats.reduce((sum, s) => sum + s.weeklyMinutes, 0);
  const avgHealthScore = childStats.length
    ? Math.round(childStats.reduce((sum, s) => sum + s.healthScore, 0) / childStats.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading all children data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Today</p>
                  <p className="text-2xl font-bold">{formatTime(totalTodayMinutes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total This Week</p>
                  <p className="text-2xl font-bold">{formatTime(totalWeeklyMinutes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${getHealthBg(avgHealthScore)}`}>
                  <Users className={`h-6 w-6 ${getHealthColor(avgHealthScore)}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Health Score</p>
                  <p className={`text-2xl font-bold ${getHealthColor(avgHealthScore)}`}>
                    {avgHealthScore}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Per-Child Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Children Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {childStats.map((stats, index) => (
                <motion.div
                  key={stats.childId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="rounded-xl border border-border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSelectChild(stats.childId)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{stats.childName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {stats.lastActive
                          ? `Last active: ${new Date(stats.lastActive).toLocaleDateString()}`
                          : 'No recent activity'}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthBg(stats.healthScore)} ${getHealthColor(stats.healthScore)}`}
                    >
                      {stats.healthScore}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Today:</span>
                      <span className="font-medium">{formatTime(stats.todayMinutes)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Week:</span>
                      <span className="font-medium">{formatTime(stats.weeklyMinutes)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GamepadIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Top:</span>
                      <span className="font-medium truncate">{stats.topGame || 'None'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Late:</span>
                      <span
                        className={`font-medium ${stats.lateNightCount > 2 ? 'text-yellow-500' : ''}`}
                      >
                        {stats.lateNightCount} sessions
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border">
                    <button className="text-sm text-primary hover:underline flex items-center gap-1">
                      View detailed insights
                      <TrendingUp className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Alerts */}
      {childStats.some((s) => s.healthScore < 60 || s.lateNightCount > 3) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <TrendingDown className="h-5 w-5" />
                Attention Needed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {childStats
                  .filter((s) => s.healthScore < 60)
                  .map((s) => (
                    <li key={`health-${s.childId}`} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span>
                        {s.childName}'s health score is {s.healthScore} - consider checking their
                        gaming patterns
                      </span>
                    </li>
                  ))}
                {childStats
                  .filter((s) => s.lateNightCount > 3)
                  .map((s) => (
                    <li key={`late-${s.childId}`} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span>
                        {s.childName} had {s.lateNightCount} late-night gaming sessions this week
                      </span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// src/components/dashboard/SessionTimer.tsx
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CurrentSession } from '@/types';

interface SessionTimerProps {
  session: CurrentSession | null;
}

export function SessionTimer({ session }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session) {
      setElapsed(0);
      return;
    }

    const startTime = new Date(session.started_at).getTime();
    
    const updateElapsed = () => {
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000 / 60); // minutes
      setElapsed(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [session]);

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No active gaming session
          </div>
        </CardContent>
      </Card>
    );
  }

  const hours = Math.floor(elapsed / 60);
  const minutes = elapsed % 60;

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Current Session</span>
          <span className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-bold text-foreground mb-2">
              {session.game_name}
            </p>
            <Badge variant={session.category as any}>
              {session.category}
            </Badge>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">
              {hours > 0 ? `${hours}h` : ''} {minutes}m
            </span>
            <span className="text-sm text-muted-foreground">elapsed</span>
          </div>

          <div className="text-xs text-muted-foreground">
            Started at {new Date(session.started_at).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


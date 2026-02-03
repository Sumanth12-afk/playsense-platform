// src/components/dashboard/GamesList.tsx
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { GameStats } from '@/types';
import { formatDuration, formatDate } from '@/lib/utils';

interface GamesListProps {
  games: GameStats[];
}

export function GamesList({ games }: GamesListProps) {
  if (games.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Games</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No games tracked yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Games</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {games.map((game, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-foreground">{game.name}</p>
                  <Badge variant={game.category as any}>{game.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {game.sessionCount} session{game.sessionCount !== 1 ? 's' : ''} •
                  Last played {formatDate(game.lastPlayed)}
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-bold text-foreground">
                  {formatDuration(game.totalMinutes)}
                </p>
                <p className="text-xs text-muted-foreground">total</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


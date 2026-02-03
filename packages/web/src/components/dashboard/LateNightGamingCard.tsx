import { LateNightGaming } from '@playsense/shared';
import { Moon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  lateNightGaming: LateNightGaming | null;
}

export default function LateNightGamingCard({ lateNightGaming }: Props) {
  if (!lateNightGaming) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Late Night Gaming</h3>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (lateNightGaming.trend === 'improving') return TrendingUp;
    if (lateNightGaming.trend === 'worsening') return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (lateNightGaming.trend === 'improving') return 'text-green-600';
    if (lateNightGaming.trend === 'worsening') return 'text-red-600';
    return 'text-gray-600';
  };

  const getSeverityColor = (sessions: number) => {
    if (sessions === 0) return 'bg-green-100 text-green-700';
    if (sessions <= 2) return 'bg-blue-100 text-blue-700';
    if (sessions <= 4) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const TrendIcon = getTrendIcon();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Late Night Gaming</h3>
          <p className="text-sm text-gray-500 mt-1">After 10 PM</p>
        </div>
        <Moon className="w-5 h-5 text-primary-600" />
      </div>

      <div className="text-center mb-4">
        <div className={`inline-block px-6 py-3 rounded-xl ${getSeverityColor(lateNightGaming.sessions_after_10pm)}`}>
          <div className="text-3xl font-bold">
            {lateNightGaming.sessions_after_10pm}
          </div>
          <div className="text-sm font-medium mt-1">
            sessions this week
          </div>
        </div>

        {lateNightGaming.hours_after_10pm > 0 && (
          <p className="text-sm text-gray-600 mt-3">
            {lateNightGaming.hours_after_10pm}h total
          </p>
        )}
      </div>

      <div className={`flex items-center justify-center gap-2 mb-4 ${getTrendColor()}`}>
        <TrendIcon className="w-4 h-4" />
        <span className="text-sm font-medium capitalize">{lateNightGaming.trend}</span>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          {lateNightGaming.explanation}
        </p>
      </div>

      {lateNightGaming.sessions_after_10pm > 4 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs text-red-700">
            <strong>Sleep Impact:</strong> Frequent late-night gaming can affect sleep quality, mood, and daily energy levels.
          </p>
        </div>
      )}
    </div>
  );
}


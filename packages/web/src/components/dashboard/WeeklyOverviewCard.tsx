import { WeeklyOverview } from '@playsense/shared';
import { TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  weeklyOverview: WeeklyOverview | null;
}

export default function WeeklyOverviewCard({ weeklyOverview }: Props) {
  if (!weeklyOverview) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Weekly Overview</h3>
        <p className="text-gray-500">No data available yet</p>
      </div>
    );
  }

  const getBarColor = (hours: number) => {
    if (hours <= 2) return '#10b981'; // green
    if (hours <= 4) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Weekly Overview</h3>
          <p className="text-sm text-gray-500 mt-1">
            Last 7 days · {weeklyOverview.average_hours_per_day}h average per day
          </p>
        </div>
        <TrendingUp className="w-5 h-5 text-primary-600" />
      </div>

      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyOverview.days}>
            <XAxis dataKey="day_name" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value}h`, 'Gaming Time']}
            />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
              {weeklyOverview.days.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.hours)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">Weekday Average</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{weeklyOverview.weekday_avg}h</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-700 font-medium">Weekend Average</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{weeklyOverview.weekend_avg}h</p>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Insight:</span> {weeklyOverview.insight}
        </p>
      </div>
    </div>
  );
}

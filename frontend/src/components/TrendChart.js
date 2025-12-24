/**
 * 24-Hour Trend Chart Component
 * Shows predicted vs historical travel times
 */
import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

const TrendChart = ({ checkpoint, mode, currentHour }) => {
  // Generate 24-hour trend data
  const generateTrendData = () => {
    const data = [];
    const baseTime = checkpoint === 'woodlands' ? 30 : 25;
    const modeFactor = mode === 'bus' ? 1.4 : 1.0;
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;

    for (let hour = 0; hour < 24; hour++) {
      let multiplier = 1.0;

      // Morning peak (7-10am)
      if (hour >= 7 && hour <= 9) {
        multiplier = 2.5 + (Math.random() * 0.5);
      }
      // Evening peak (5-9pm)
      else if (hour >= 17 && hour <= 20) {
        multiplier = 2.7 + (Math.random() * 0.5);
      }
      // Shoulder hours
      else if ((hour >= 6 && hour < 7) || (hour >= 10 && hour <= 16) || (hour >= 21 && hour <= 22)) {
        multiplier = 1.5 + (Math.random() * 0.3);
      }
      // Off-peak
      else {
        multiplier = 0.7 + (Math.random() * 0.2);
      }

      // Weekend adjustment
      if (isWeekend) {
        multiplier *= 1.2;
      }

      const predicted = Math.round(baseTime * multiplier * modeFactor);
      const historical = Math.round(baseTime * multiplier * modeFactor * (0.9 + Math.random() * 0.2));

      data.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        hourNum: hour,
        predicted,
        historical,
      });
    }

    return data;
  };

  const data = generateTrendData();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-slate-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value} min</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px] bg-white rounded-xl border border-slate-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">24-Hour Traffic Forecast</h3>
        <p className="text-sm text-slate-600">
          Predicted travel time throughout the day ({checkpoint === 'woodlands' ? 'Woodlands' : 'Tuas'} • {mode === 'car' ? 'Car' : 'Bus'})
        </p>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

          <XAxis
            dataKey="hour"
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            interval={2}
          />

          <YAxis
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {/* Current time marker */}
          {currentHour !== undefined && (
            <ReferenceLine
              x={`${currentHour.toString().padStart(2, '0')}:00`}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: 'Now',
                position: 'top',
                fill: '#ef4444',
                fontSize: 12,
                fontWeight: 600
              }}
            />
          )}

          {/* Historical average (dashed line) */}
          <Line
            type="monotone"
            dataKey="historical"
            name="Historical Avg"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />

          {/* Predicted (area chart) */}
          <Area
            type="monotone"
            dataKey="predicted"
            name="Predicted"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#colorPredicted)"
            dot={{ fill: '#3b82f6', r: 3 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;

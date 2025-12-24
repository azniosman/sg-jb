/**
 * 24-Hour Forecast Chart Component
 */
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ForecastChart.css';

const ForecastChart = ({ checkpoint, date }) => {
  const getCheckpointName = () => {
    return checkpoint === 'woodlands' ? 'Woodlands' : 'Tuas';
  };

  // Generate 24-hour forecast data
  const generateForecastData = () => {
    const data = [];
    const baseTime = 30;

    for (let hour = 0; hour < 24; hour++) {
      let time = baseTime;

      // Morning peak (7-9 AM)
      if (hour >= 7 && hour <= 9) {
        time = baseTime * (2.2 + Math.random() * 0.6);
      }
      // Evening peak (5-7 PM)
      else if (hour >= 17 && hour <= 19) {
        time = baseTime * (2.5 + Math.random() * 0.8);
      }
      // Shoulder hours
      else if ((hour >= 6 && hour <= 10) || (hour >= 16 && hour <= 20)) {
        time = baseTime * (1.5 + Math.random() * 0.5);
      }
      // Off-peak
      else {
        time = baseTime * (0.8 + Math.random() * 0.4);
      }

      data.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        time: Math.round(time),
      });
    }

    return data;
  };

  const data = generateForecastData();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">{payload[0].payload.hour}</p>
          <p className="tooltip-value">{payload[0].value} min</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon">📈</span>
        24-Hour Forecast ({getCheckpointName()})
      </div>

      <div className="forecast-chart">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="hour"
              stroke="#94a3b8"
              style={{ fontSize: '0.75rem' }}
              interval={3}
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: '0.75rem' }}
              label={{
                value: 'Mins',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '0.75rem', fill: '#64748b' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="time"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="chart-legend">
          <div className="legend-item-inline">
            <div className="legend-dot" />
            <span>Est. Time</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;

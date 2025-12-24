/**
 * Charts component for displaying historical data and trends
 */
import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getHistoricalData } from '../services/api';
import './Charts.css';

const Charts = ({ origin, destination }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistoricalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination]);

  const fetchHistoricalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHistoricalData(30, origin, destination);

      // Process data for charts
      // Group by date and calculate average
      const byDate = {};
      data.forEach((point) => {
        if (!byDate[point.date]) {
          byDate[point.date] = {
            date: point.date,
            totalTime: 0,
            count: 0,
          };
        }
        byDate[point.date].totalTime += point.avg_travel_time;
        byDate[point.date].count += 1;
      });

      const processedData = Object.values(byDate)
        .map((d) => ({
          date: d.date,
          avgTime: Math.round(d.totalTime / d.count),
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-14); // Last 14 days

      setHistoricalData(processedData);
    } catch (err) {
      setError('Failed to load historical data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (loading) {
    return (
      <div className="charts-container">
        <div className="loading">Loading historical data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="charts-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (historicalData.length === 0) {
    return (
      <div className="charts-container">
        <div className="no-data">No historical data available</div>
      </div>
    );
  }

  return (
    <div className="charts-container">
      <h3>Historical Travel Times (Last 14 Days)</h3>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              labelFormatter={formatDate}
              formatter={(value) => [`${value} min`, 'Avg Travel Time']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgTime"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Avg Travel Time"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-wrapper">
        <h4>Average Travel Time by Day</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={formatDate}
              formatter={(value) => [`${value} min`, 'Travel Time']}
            />
            <Bar dataKey="avgTime" fill="#3b82f6" name="Avg Time (min)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;

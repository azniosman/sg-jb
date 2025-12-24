/**
 * SG-JB Link Traffic Intelligence Dashboard
 * Comprehensive React dashboard with Tailwind CSS
 */
import React, { useState, useEffect } from 'react';
import {
  Clock, Car, Bus, MapPin, TrendingUp, Cloud,
  Activity, ThumbsUp, AlertTriangle, Check,
  Loader2, Info, Navigation
} from 'lucide-react';
import { predictTravelTime, getWaitTime, getLiveTraffic } from './services/api';

function App() {
  // State management
  const [route, setRoute] = useState('woodlands');
  const [mode, setMode] = useState('car');
  const [origin, setOrigin] = useState('singapore');
  const [destination, setDestination] = useState('jb');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [travelTime, setTravelTime] = useState('18:00');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [waitTimeData, setWaitTimeData] = useState(null);
  const [crowdVotes, setCrowdVotes] = useState({ clear: 42, busy: 35, packed: 23 });
  const [userVoted, setUserVoted] = useState(false);
  const [activeTab, setActiveTab] = useState('forecast');
  const [lastSynced, setLastSynced] = useState(new Date());

  // Fetch prediction when inputs change
  useEffect(() => {
    if (origin && destination && travelDate && travelTime) {
      handlePredict();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, mode, origin, destination, travelDate, travelTime]);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const formData = {
        origin,
        destination,
        travel_date: travelDate,
        travel_time: travelTime,
        mode,
        checkpoint: route
      };

      const result = await predictTravelTime(formData);
      setPrediction(result);
      setLastSynced(new Date());

      // Fetch wait time
      try {
        const waitTime = await getWaitTime(route, origin, destination);
        setWaitTimeData(waitTime);
      } catch (err) {
        console.warn('Failed to fetch wait time:', err);
      }
    } catch (err) {
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleCrowdVote = (type) => {
    if (userVoted) return;
    setCrowdVotes(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
    setUserVoted(true);
    localStorage.setItem('userVoted', 'true');
  };

  // Calculate crowd percentages
  const totalVotes = crowdVotes.clear + crowdVotes.busy + crowdVotes.packed;
  const crowdPercent = {
    clear: Math.round((crowdVotes.clear / totalVotes) * 100),
    busy: Math.round((crowdVotes.busy / totalVotes) * 100),
    packed: Math.round((crowdVotes.packed / totalVotes) * 100)
  };

  // Get congestion badge color
  const getCongestionColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-500';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-500';
      case 'severe': return 'bg-red-100 text-red-800 border-red-500';
      default: return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  // Time since last sync
  const getTimeSince = () => {
    const seconds = Math.floor((new Date() - lastSynced) / 1000);
    if (seconds < 60) return `${seconds} secs ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-slate-900">
                SG-JB Link Traffic Intelligence
              </h1>
            </div>

            <div className="flex items-center gap-6">
              {/* Status Indicators */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌉</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-600">Woodlands</span>
                    <span className={`text-xs font-semibold ${prediction && route === 'woodlands' ? getCongestionColor(prediction.congestion_level) : 'text-slate-400'}`}>
                      {prediction && route === 'woodlands' ? prediction.congestion_level : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌁</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-600">Tuas</span>
                    <span className={`text-xs font-semibold ${prediction && route === 'tuas' ? getCongestionColor(prediction.congestion_level) : 'text-slate-400'}`}>
                      {prediction && route === 'tuas' ? prediction.congestion_level : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Last Synced */}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Last synced: {getTimeSince()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
          {/* Left Sidebar */}
          <aside className="space-y-6">
            {/* Trip Planner Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-slate-900">Trip Planner</h2>
              </div>

              <div className="space-y-4">
                {/* Origin/Destination */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">FROM</label>
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="singapore">Singapore</option>
                      <option value="jb">Johor Bahru</option>
                    </select>
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleSwap}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <TrendingUp className="w-5 h-5 text-slate-600 rotate-90" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">TO</label>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="jb">Johor Bahru</option>
                      <option value="singapore">Singapore</option>
                    </select>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">DATE</label>
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">TIME</label>
                    <input
                      type="time"
                      value={travelTime}
                      onChange={(e) => setTravelTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Route Toggle */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">ROUTE</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRoute('woodlands')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                        route === 'woodlands'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <span className="text-xl">🌉</span>
                      <span className="text-xs font-medium">Woodlands</span>
                      <span className="text-xs text-slate-600">~45 min</span>
                    </button>
                    <button
                      onClick={() => setRoute('tuas')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                        route === 'tuas'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <span className="text-xl">🌁</span>
                      <span className="text-xs font-medium">Tuas</span>
                      <span className="text-xs text-slate-600">~38 min</span>
                    </button>
                  </div>
                </div>

                {/* Mode Toggle */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">MODE</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMode('car')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        mode === 'car'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      <span className="text-sm font-medium">Car</span>
                    </button>
                    <button
                      onClick={() => setMode('bus')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        mode === 'bus'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <Bus className="w-4 h-4" />
                      <span className="text-sm font-medium">Bus</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Crowd Reporting Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-slate-900">Immigration Hall Status</h3>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => handleCrowdVote('clear')}
                  disabled={userVoted}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    userVoted
                      ? 'opacity-50 cursor-not-allowed border-slate-200'
                      : 'border-green-500 hover:bg-green-50'
                  }`}
                >
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-xs font-medium">Clear</span>
                </button>
                <button
                  onClick={() => handleCrowdVote('busy')}
                  disabled={userVoted}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    userVoted
                      ? 'opacity-50 cursor-not-allowed border-slate-200'
                      : 'border-yellow-500 hover:bg-yellow-50'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-xs font-medium">Busy</span>
                </button>
                <button
                  onClick={() => handleCrowdVote('packed')}
                  disabled={userVoted}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    userVoted
                      ? 'opacity-50 cursor-not-allowed border-slate-200'
                      : 'border-red-500 hover:bg-red-50'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5 text-red-600 rotate-180" />
                  <span className="text-xs font-medium">Packed</span>
                </button>
              </div>

              {/* Sentiment Bars */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-600 mb-2">Current Sentiment:</div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${crowdPercent.clear}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 w-12">{crowdPercent.clear}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 transition-all"
                        style={{ width: `${crowdPercent.busy}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 w-12">{crowdPercent.busy}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all"
                        style={{ width: `${crowdPercent.packed}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 w-12">{crowdPercent.packed}%</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Dashboard */}
          <main className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  <span className="text-slate-600">Calculating traffic...</span>
                </div>
              </div>
            ) : prediction ? (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Predicted Duration */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-slate-600">Predicted Duration</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {Math.round(prediction.predicted_time_minutes)} min
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Range: {Math.round(prediction.lower_bound_minutes)}-{Math.round(prediction.upper_bound_minutes)} min
                    </div>
                  </div>

                  {/* Congestion Level */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Car className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-slate-600">Congestion</div>
                        <div className="mt-1">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border-2 ${getCongestionColor(prediction.congestion_level)}`}>
                            {prediction.congestion_level}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">Based on historical data</div>
                  </div>

                  {/* Weather */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Cloud className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-slate-600">Weather</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {Math.round(prediction.features_used?.temp_c || 31)}°C
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">Clear</div>
                  </div>

                  {/* Traffic Pattern */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-slate-600">Pattern</div>
                        <div className="text-lg font-bold text-slate-900">
                          {prediction.features_used?.is_weekend ? 'Weekend' : 'Weekday'}
                          {prediction.features_used?.is_evening_peak ? ' Peak' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Avg: {Math.round(prediction.features_used?.historical_avg_time || 35)} min
                    </div>
                  </div>
                </div>

                {/* Checkpoint Wait Time */}
                {waitTimeData && (
                  <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl shadow-sm border border-primary-200 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-primary-600" />
                        <div>
                          <div className="font-semibold text-slate-900">
                            Estimated Checkpoint Wait: {Math.round(waitTimeData.estimated_wait_minutes)} minutes
                          </div>
                          <div className="text-sm text-slate-600">
                            Range: {Math.round(waitTimeData.min_wait_minutes)}-{Math.round(waitTimeData.max_wait_minutes)} min
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alert for severe congestion */}
                {(prediction.congestion_level === 'high' || prediction.congestion_level === 'severe') && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="font-semibold text-red-900">Heavy Congestion Expected</div>
                        <div className="text-sm text-red-700">
                          {prediction.alert || 'Consider alternative timing or route.'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Placeholder for visualizations - will implement next */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="text-center text-slate-500 py-12">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p>Visualizations coming next...</p>
                    <p className="text-sm mt-2">Custom SVG map, 24-hour chart, and live cameras</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <Navigation className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Welcome to SG-JB Link Traffic Intelligence
                </h2>
                <p className="text-slate-600 max-w-md mx-auto">
                  Configure your trip details in the sidebar to get started with intelligent traffic predictions.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

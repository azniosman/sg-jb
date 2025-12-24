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
import { predictTravelTime, getWaitTime } from './services/api';
import SmartRecommendation from './components/SmartRecommendation';
import SchematicMap from './components/SchematicMap';
import TrendChart from './components/TrendChart';
import CameraFeeds from './components/CameraFeeds';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Sticky Header with glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-soft">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-info rounded-xl shadow-glow">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  SG-JB Link Intelligence
                </h1>
                <p className="text-xs text-slate-500 font-medium">Real-time Traffic Prediction</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Status Indicators */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-soft border border-slate-100">
                  <span className="text-xl">🌉</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Woodlands</span>
                    <span className={`text-xs font-bold ${prediction && route === 'woodlands' ? getCongestionColor(prediction.congestion_level) : 'text-slate-400'}`}>
                      {prediction && route === 'woodlands' ? prediction.congestion_level : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-soft border border-slate-100">
                  <span className="text-xl">🌁</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Tuas</span>
                    <span className={`text-xs font-bold ${prediction && route === 'tuas' ? getCongestionColor(prediction.congestion_level) : 'text-slate-400'}`}>
                      {prediction && route === 'tuas' ? prediction.congestion_level : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Last Synced */}
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 rounded-full text-sm text-slate-600 border border-slate-200/50">
                <Clock className="w-4 h-4 text-primary-500 animate-pulse-soft" />
                <span className="font-medium">{getTimeSince()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
          {/* Left Sidebar */}
          <aside className="space-y-5">
            {/* Trip Planner Card */}
            <div className="bg-white rounded-2xl shadow-medium border border-slate-100 p-6 hover:shadow-hard transition-all duration-300">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Trip Planner</h2>
              </div>

              <div className="space-y-4">
                {/* Origin/Destination */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">From</label>
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all duration-200 font-medium text-slate-700"
                    >
                      <option value="singapore">🇸🇬 Singapore</option>
                      <option value="jb">🇲🇾 Johor Bahru</option>
                    </select>
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center -my-1">
                    <button
                      onClick={handleSwap}
                      className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <TrendingUp className="w-4 h-4 rotate-90" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">To</label>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all duration-200 font-medium text-slate-700"
                    >
                      <option value="jb">🇲🇾 Johor Bahru</option>
                      <option value="singapore">🇸🇬 Singapore</option>
                    </select>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Date</label>
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all duration-200 font-medium text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Time</label>
                    <input
                      type="time"
                      value={travelTime}
                      onChange={(e) => setTravelTime(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all duration-200 font-medium text-slate-700"
                    />
                  </div>
                </div>

                {/* Route Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Route</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setRoute('woodlands')}
                      className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                        route === 'woodlands'
                          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-primary-300 hover:shadow-soft'
                      }`}
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">🌉</span>
                      <span className={`text-xs font-bold ${route === 'woodlands' ? 'text-primary-700' : 'text-slate-700'}`}>Woodlands</span>
                      <span className="text-[10px] text-slate-500 font-medium">~45 min</span>
                      {route === 'woodlands' && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                    <button
                      onClick={() => setRoute('tuas')}
                      className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                        route === 'tuas'
                          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-primary-300 hover:shadow-soft'
                      }`}
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">🌁</span>
                      <span className={`text-xs font-bold ${route === 'tuas' ? 'text-primary-700' : 'text-slate-700'}`}>Tuas</span>
                      <span className="text-[10px] text-slate-500 font-medium">~38 min</span>
                      {route === 'tuas' && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Mode Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMode('car')}
                      className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-300 ${
                        mode === 'car'
                          ? 'border-primary-500 bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-soft text-slate-700'
                      }`}
                    >
                      <Car className="w-5 h-5" />
                      <span className="text-sm font-bold">Car</span>
                    </button>
                    <button
                      onClick={() => setMode('bus')}
                      className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-300 ${
                        mode === 'bus'
                          ? 'border-primary-500 bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-soft text-slate-700'
                      }`}
                    >
                      <Bus className="w-5 h-5" />
                      <span className="text-sm font-bold">Bus</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Recommendation */}
            {prediction && (
              <SmartRecommendation
                currentTime={travelTime}
                currentDuration={prediction.predicted_time_minutes}
                checkpoint={route}
                mode={mode}
              />
            )}

            {/* Crowd Reporting Card */}
            <div className="bg-white rounded-2xl shadow-medium border border-slate-100 p-6 hover:shadow-hard transition-all duration-300">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Immigration Status</h3>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-5">
                <button
                  onClick={() => handleCrowdVote('clear')}
                  disabled={userVoted}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-300 ${
                    userVoted
                      ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                      : 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-md hover:scale-105 active:scale-95'
                  }`}
                >
                  <Check className="w-6 h-6 text-green-600" />
                  <span className="text-xs font-bold text-green-700">Clear</span>
                </button>
                <button
                  onClick={() => handleCrowdVote('busy')}
                  disabled={userVoted}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-300 ${
                    userVoted
                      ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                      : 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50 hover:shadow-md hover:scale-105 active:scale-95'
                  }`}
                >
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <span className="text-xs font-bold text-yellow-700">Busy</span>
                </button>
                <button
                  onClick={() => handleCrowdVote('packed')}
                  disabled={userVoted}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-300 ${
                    userVoted
                      ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                      : 'border-red-500 bg-gradient-to-br from-red-50 to-rose-50 hover:shadow-md hover:scale-105 active:scale-95'
                  }`}
                >
                  <ThumbsUp className="w-6 h-6 text-red-600 rotate-180" />
                  <span className="text-xs font-bold text-red-700">Packed</span>
                </button>
              </div>

              {/* Sentiment Bars */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Live Sentiment</div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner-soft">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${crowdPercent.clear}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-12 text-right">{crowdPercent.clear}%</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner-soft">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${crowdPercent.busy}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-12 text-right">{crowdPercent.busy}%</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner-soft">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${crowdPercent.packed}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-12 text-right">{crowdPercent.packed}%</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Dashboard */}
          <main className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                  <span className="text-slate-600 font-medium">Analyzing traffic patterns...</span>
                </div>
              </div>
            ) : prediction ? (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
                  {/* Predicted Duration */}
                  <div className="group bg-gradient-to-br from-white to-red-50/30 rounded-2xl shadow-medium border border-red-100 p-6 hover:shadow-hard transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                          <Clock className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-1">Duration</div>
                        <div className="text-3xl font-black text-slate-900">
                          {Math.round(prediction.predicted_time_minutes)}
                          <span className="text-lg text-slate-600 ml-1">min</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        ± {Math.round(prediction.lower_bound_minutes)}-{Math.round(prediction.upper_bound_minutes)} min
                      </div>
                    </div>
                  </div>

                  {/* Congestion Level */}
                  <div className="group bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-medium border border-blue-100 p-6 hover:shadow-hard transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                          <Car className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-2">Congestion</div>
                        <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-black border-2 ${getCongestionColor(prediction.congestion_level)}`}>
                          {prediction.congestion_level}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">ML predicted</div>
                    </div>
                  </div>

                  {/* Weather */}
                  <div className="group bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-medium border border-purple-100 p-6 hover:shadow-hard transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                          <Cloud className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-1">Weather</div>
                        <div className="text-3xl font-black text-slate-900">
                          {Math.round(prediction.features_used?.temp_c || 31)}
                          <span className="text-lg text-slate-600">°C</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Clear skies</div>
                    </div>
                  </div>

                  {/* Traffic Pattern */}
                  <div className="group bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl shadow-medium border border-emerald-100 p-6 hover:shadow-hard transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                          <Activity className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-1">Pattern</div>
                        <div className="text-lg font-black text-slate-900">
                          {prediction.features_used?.is_weekend ? 'Weekend' : 'Weekday'}
                          {prediction.features_used?.is_evening_peak ? ' Peak' : ''}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Avg: {Math.round(prediction.features_used?.historical_avg_time || 35)} min
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkpoint Wait Time */}
                {waitTimeData && (
                  <div className="bg-gradient-to-r from-primary-50 via-blue-50 to-indigo-50 rounded-2xl shadow-medium border border-primary-200/50 p-6 hover:shadow-hard transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-soft">
                        <Info className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 text-lg mb-1">
                          Checkpoint Wait: {Math.round(waitTimeData.estimated_wait_minutes)} minutes
                        </div>
                        <div className="text-sm text-slate-600 font-medium">
                          Range: {Math.round(waitTimeData.min_wait_minutes)}-{Math.round(waitTimeData.max_wait_minutes)} min
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alert for severe congestion */}
                {(prediction.congestion_level === 'high' || prediction.congestion_level === 'severe') && (
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-xl shadow-medium p-5 animate-slide-down">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-red-100 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <div className="font-bold text-red-900 text-lg">Heavy Congestion Expected</div>
                        <div className="text-sm text-red-700 mt-1 font-medium">
                          {prediction.alert || 'Consider alternative timing or route.'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabbed Visualizations */}
                <div className="bg-white rounded-2xl shadow-medium border border-slate-100 overflow-hidden">
                  {/* Tab Buttons */}
                  <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
                    <button
                      onClick={() => setActiveTab('forecast')}
                      className={`flex-1 px-6 py-3 font-bold text-sm rounded-xl transition-all duration-300 ${
                        activeTab === 'forecast'
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                    >
                      📊 Traffic Forecast
                    </button>
                    <button
                      onClick={() => setActiveTab('cameras')}
                      className={`flex-1 px-6 py-3 font-bold text-sm rounded-xl transition-all duration-300 ${
                        activeTab === 'cameras'
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                    >
                      📹 Live Cameras
                    </button>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'forecast' ? (
                    <div className="p-6 space-y-6">
                      {/* Schematic Map */}
                      <SchematicMap
                        selectedRoute={route}
                        congestionLevel={prediction.congestion_level}
                        direction={destination}
                      />

                      {/* 24-Hour Trend Chart */}
                      <TrendChart
                        checkpoint={route}
                        mode={mode}
                        currentHour={parseInt(travelTime.split(':')[0])}
                      />
                    </div>
                  ) : (
                    <div className="p-6">
                      <CameraFeeds checkpoint={route} />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 rounded-2xl shadow-medium border border-slate-200 p-16 text-center">
                <div className="max-w-lg mx-auto">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-info rounded-2xl flex items-center justify-center shadow-glow">
                    <Navigation className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">
                    Welcome to SG-JB Link Intelligence
                  </h2>
                  <p className="text-slate-600 text-lg font-medium mb-8">
                    Configure your trip details in the sidebar to get started with AI-powered traffic predictions.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-white rounded-xl shadow-soft">
                      <div className="text-2xl mb-2">🤖</div>
                      <div className="text-xs font-bold text-slate-700">ML Powered</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl shadow-soft">
                      <div className="text-2xl mb-2">⚡</div>
                      <div className="text-xs font-bold text-slate-700">Real-time</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl shadow-soft">
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-xs font-bold text-slate-700">Data-driven</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

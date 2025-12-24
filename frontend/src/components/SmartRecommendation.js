/**
 * Smart Recommendation Component
 * Analyzes ±3 hour window to find optimal departure time
 */
import React from 'react';
import { Lightbulb, Clock } from 'lucide-react';

const SmartRecommendation = ({ currentTime, currentDuration, checkpoint, mode }) => {
  // Generate hourly predictions for ±3 hours
  const generateTimeOptions = () => {
    const options = [];
    const [hour, minute] = currentTime.split(':').map(Number);
    const currentMinutes = hour * 60 + minute;

    for (let offset = -3; offset <= 3; offset++) {
      if (offset === 0) continue; // Skip current time

      const testMinutes = currentMinutes + (offset * 60);
      const testHour = Math.floor(testMinutes / 60) % 24;
      const testMin = testMinutes % 60;

      // Estimate duration based on hour
      const duration = estimateDuration(testHour, checkpoint, mode);
      const savings = currentDuration - duration;

      if (savings > 15) { // Only show if >15 min savings
        options.push({
          offset,
          hour: testHour,
          minute: testMin,
          duration,
          savings
        });
      }
    }

    return options.sort((a, b) => b.savings - a.savings)[0]; // Return best option
  };

  // Estimate duration based on time of day (simplified logic)
  const estimateDuration = (hour, checkpoint, mode) => {
    const baseTime = checkpoint === 'woodlands' ? 30 : 25;
    const modeFactor = mode === 'bus' ? 1.4 : 1.0;

    // Peak hours
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return Math.round(baseTime * 2.5 * modeFactor);
    }
    // Shoulder hours
    if ((hour >= 6 && hour < 7) || (hour >= 10 && hour <= 16) || (hour >= 20 && hour <= 22)) {
      return Math.round(baseTime * 1.5 * modeFactor);
    }
    // Off-peak
    return Math.round(baseTime * modeFactor);
  };

  const bestOption = generateTimeOptions();

  if (!bestOption) {
    return null; // No significant savings found
  }

  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const getOffsetText = (offset) => {
    if (offset < 0) {
      return `${Math.abs(offset)} hour${Math.abs(offset) > 1 ? 's' : ''} earlier`;
    }
    return `${offset} hour${offset > 1 ? 's' : ''} later`;
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl shadow-medium border-2 border-amber-300/50 p-6 hover:shadow-hard transition-all duration-300 animate-slide-up">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-black text-amber-900 uppercase tracking-wide">💡 Smart Tip</h3>
          </div>
          <p className="text-amber-900 font-bold mb-3 text-sm leading-relaxed">
            Depart {getOffsetText(bestOption.offset)} ({formatTime(bestOption.hour, bestOption.minute)}) to save{' '}
            <span className="inline-block px-2 py-1 bg-amber-200 rounded-lg text-amber-900 font-black">
              {Math.round(bestOption.savings)} min
            </span>
          </p>
          <div className="flex items-center gap-2 text-xs text-amber-800 bg-white/50 rounded-lg px-3 py-2 font-medium">
            <Clock className="w-4 h-4" />
            <span>
              {bestOption.duration} min (vs {Math.round(currentDuration)} min now)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartRecommendation;

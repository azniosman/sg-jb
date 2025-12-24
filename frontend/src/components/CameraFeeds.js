/**
 * Camera Feeds Component
 * Mock live camera views of checkpoints
 */
import React from 'react';
import { Video, Wifi } from 'lucide-react';

const CameraFeeds = ({ checkpoint }) => {
  const cameras = [
    {
      id: 1,
      name: `${checkpoint === 'woodlands' ? 'Woodlands' : 'Tuas'} - Lane 1-4`,
      lastUpdate: '2 mins ago',
      status: 'live'
    },
    {
      id: 2,
      name: `${checkpoint === 'woodlands' ? 'Woodlands' : 'Tuas'} - Lane 5-8`,
      lastUpdate: '2 mins ago',
      status: 'live'
    },
    {
      id: 3,
      name: `${checkpoint === 'woodlands' ? 'Woodlands' : 'Tuas'} - Immigration Hall`,
      lastUpdate: '3 mins ago',
      status: 'live'
    },
    {
      id: 4,
      name: `${checkpoint === 'woodlands' ? 'Woodlands' : 'Tuas'} - Customs Area`,
      lastUpdate: '1 min ago',
      status: 'live'
    },
    {
      id: 5,
      name: `${checkpoint === 'woodlands' ? 'Woodlands' : 'Tuas'} - Motorcycle Lane`,
      lastUpdate: '4 mins ago',
      status: 'live'
    },
    {
      id: 6,
      name: `${checkpoint === 'woodlands' ? 'Woodlands' : 'Tuas'} - Bus Terminal`,
      lastUpdate: '2 mins ago',
      status: 'live'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Live Camera Feeds</h3>
          <p className="text-sm text-slate-600 mt-1">
            Real-time views of {checkpoint === 'woodlands' ? 'Woodlands Checkpoint' : 'Tuas Second Link'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">All cameras online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameras.map((camera) => (
          <div
            key={camera.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* Camera View */}
            <div className="relative bg-slate-900 aspect-video">
              {/* Placeholder with scanline effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900">
                  {/* Mock traffic scene with shapes */}
                  <svg className="w-full h-full opacity-60" viewBox="0 0 400 300">
                    {/* Road */}
                    <rect x="0" y="150" width="400" height="80" fill="#374151" />
                    <rect x="0" y="185" width="400" height="5" fill="#fbbf24" opacity="0.5" strokeDasharray="20 10" />

                    {/* Vehicles (rectangles) */}
                    <rect x="50" y="155" width="60" height="35" rx="4" fill="#60a5fa" opacity="0.8" />
                    <rect x="150" y="160" width="55" height="30" rx="4" fill="#34d399" opacity="0.7" />
                    <rect x="280" y="158" width="65" height="33" rx="4" fill="#f87171" opacity="0.8" />
                    <rect x="70" y="200" width="58" height="32" rx="4" fill="#a78bfa" opacity="0.7" />
                    <rect x="220" y="195" width="62" height="35" rx="4" fill="#fbbf24" opacity="0.8" />
                  </svg>

                  {/* Scanline animation effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent opacity-10 animate-pulse" />

                  {/* Timestamp overlay */}
                  <div className="absolute top-3 left-3 bg-black bg-opacity-60 px-2 py-1 rounded text-white text-xs font-mono">
                    {new Date().toLocaleTimeString()}
                  </div>

                  {/* Video icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-16 h-16 text-white opacity-20" />
                  </div>
                </div>
              </div>

              {/* Live indicator */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-white">LIVE</span>
              </div>
            </div>

            {/* Camera Info */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">{camera.name}</h4>
                  <p className="text-xs text-slate-600">Updated: {camera.lastUpdate}</p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-green-600 font-medium">{camera.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-xs text-slate-600">
          <strong>Note:</strong> Camera feeds are simulated for demonstration purposes. In production, these would connect to actual CCTV streams via secure APIs.
        </p>
      </div>
    </div>
  );
};

export default CameraFeeds;

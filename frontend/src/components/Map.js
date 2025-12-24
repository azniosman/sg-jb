/**
 * Interactive map component showing Singapore-JB route
 */
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const Map = ({ origin, destination, congestionLevel }) => {
  // Coordinates
  const locations = {
    singapore: [1.3521, 103.8198],
    jb: [1.4655, 103.7578],
    'johor bahru': [1.4655, 103.7578],
  };

  const originCoords = locations[origin?.toLowerCase()] || locations.singapore;
  const destCoords = locations[destination?.toLowerCase()] || locations.jb;

  // Center map between origin and destination
  const center = [
    (originCoords[0] + destCoords[0]) / 2,
    (originCoords[1] + destCoords[1]) / 2,
  ];

  // Polyline color based on congestion (moved into useMemo)
  const lineColor = useMemo(() => {
    switch (congestionLevel) {
      case 'low':
        return '#22c55e'; // green
      case 'moderate':
        return '#eab308'; // yellow
      case 'high':
        return '#f97316'; // orange
      case 'severe':
        return '#ef4444'; // red
      default:
        return '#3b82f6'; // blue
    }
  }, [congestionLevel]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Origin marker */}
        <Marker position={originCoords}>
          <Popup>
            <strong>Origin:</strong> {origin}
          </Popup>
        </Marker>

        {/* Destination marker */}
        <Marker position={destCoords}>
          <Popup>
            <strong>Destination:</strong> {destination}
          </Popup>
        </Marker>

        {/* Route polyline */}
        <Polyline
          positions={[originCoords, destCoords]}
          color={lineColor}
          weight={5}
          opacity={0.7}
        />
      </MapContainer>
    </div>
  );
};

export default Map;

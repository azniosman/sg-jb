/**
 * Travel Plan Sidebar - matches UI/UX design
 */
import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ onPredict, loading }) => {
  const [formData, setFormData] = useState({
    checkpoint: 'woodlands',
    origin: 'singapore',
    destination: 'jb',
    travel_date: new Date().toISOString().split('T')[0],
    travel_time: '18:00',
    mode: 'car',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onPredict(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSwap = () => {
    setFormData((prev) => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  const getCheckpointName = () => {
    return formData.checkpoint === 'woodlands'
      ? 'Woodlands (Causeway)'
      : 'Tuas (Second Link)';
  };

  const isHolidayPeriod = () => {
    const date = new Date(formData.travel_date);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Check for common holiday periods
    if ((month === 12 && day >= 20) || month === 1) return true;
    if (month === 6 || month === 11 || month === 12) return true;

    return false;
  };

  return (
    <div className="travel-plan-card">
      <div className="card-title">
        <span className="card-title-icon">📅</span>
        <h2>Travel Plan</h2>
      </div>

      <div className="checkpoint-selector">
        <button
          type="button"
          className={`checkpoint-btn ${formData.checkpoint === 'woodlands' ? 'active' : ''}`}
          onClick={() => handleChange('checkpoint', 'woodlands')}
        >
          <span className="checkpoint-icon">🌉</span>
          <div className="checkpoint-info">
            <div className="checkpoint-name">Woodlands</div>
            <div className="checkpoint-subtext">Causeway</div>
          </div>
        </button>
        <button
          type="button"
          className={`checkpoint-btn ${formData.checkpoint === 'tuas' ? 'active' : ''}`}
          onClick={() => handleChange('checkpoint', 'tuas')}
        >
          <span className="checkpoint-icon">🌁</span>
          <div className="checkpoint-info">
            <div className="checkpoint-name">Tuas</div>
            <div className="checkpoint-subtext">Second Link</div>
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="location-group">
          <div className="location-item">
            <div className="location-icon from">📍</div>
            <div className="location-content">
              <div className="location-label">FROM</div>
              <div className="location-value">
                {formData.origin === 'singapore' ? 'Singapore' : 'Johor Bahru'}
              </div>
            </div>
          </div>

          <div className="location-item">
            <div className="location-icon swap" onClick={handleSwap}>
              ⇅
            </div>
          </div>

          <div className="location-item">
            <div className="location-icon to">📍</div>
            <div className="location-content">
              <div className="location-label">TO</div>
              <div className="location-value">
                {formData.destination === 'jb' ? 'Johor Bahru' : 'Singapore'}
              </div>
            </div>
          </div>
        </div>

        <div className="datetime-grid">
          <div className="datetime-group">
            <label className="datetime-label">Date</label>
            <input
              type="date"
              value={formData.travel_date}
              onChange={(e) => handleChange('travel_date', e.target.value)}
              className="datetime-input"
              required
            />
          </div>

          <div className="datetime-group">
            <label className="datetime-label">Departure Time</label>
            <input
              type="time"
              value={formData.travel_time}
              onChange={(e) => handleChange('travel_time', e.target.value)}
              className="datetime-input"
              required
            />
          </div>
        </div>

        <button type="submit" className="calculate-btn" disabled={loading}>
          {loading ? 'Calculating...' : 'Calculate Travel Time'}
        </button>
      </form>

      {isHolidayPeriod() && (
        <div className="holiday-alert">
          <div className="holiday-alert-icon">⚠️</div>
          <div className="holiday-alert-content">
            <div className="holiday-alert-title">Upcoming Holiday Alert</div>
            <div className="holiday-alert-text">
              School holidays detected. Expect heavier than usual traffic at{' '}
              {getCheckpointName()} between 17:00 and 20:00.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

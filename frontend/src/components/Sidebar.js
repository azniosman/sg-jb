/**
 * Sidebar component for user input
 */
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Sidebar.css';

const Sidebar = ({ onPredict, loading }) => {
  const [formData, setFormData] = useState({
    origin: 'singapore',
    destination: 'jb',
    travel_date: new Date(),
    travel_time: '08:00',
    mode: 'car',
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Format date as YYYY-MM-DD
    const year = formData.travel_date.getFullYear();
    const month = String(formData.travel_date.getMonth() + 1).padStart(2, '0');
    const day = String(formData.travel_date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    onPredict({
      ...formData,
      travel_date: dateStr,
    });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>🚗 SG-JB Travel Predictor</h1>
        <p>Predict travel times between Singapore and Johor Bahru</p>
      </div>

      <form onSubmit={handleSubmit} className="prediction-form">
        <div className="form-group">
          <label>Origin</label>
          <select
            value={formData.origin}
            onChange={(e) => handleChange('origin', e.target.value)}
            required
          >
            <option value="singapore">Singapore</option>
            <option value="jb">Johor Bahru (JB)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Destination</label>
          <select
            value={formData.destination}
            onChange={(e) => handleChange('destination', e.target.value)}
            required
          >
            <option value="jb">Johor Bahru (JB)</option>
            <option value="singapore">Singapore</option>
          </select>
        </div>

        <div className="form-group">
          <label>Travel Date</label>
          <DatePicker
            selected={formData.travel_date}
            onChange={(date) => handleChange('travel_date', date)}
            minDate={new Date()}
            dateFormat="yyyy-MM-dd"
            className="date-picker"
            required
          />
        </div>

        <div className="form-group">
          <label>Travel Time</label>
          <input
            type="time"
            value={formData.travel_time}
            onChange={(e) => handleChange('travel_time', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Mode of Travel</label>
          <select
            value={formData.mode}
            onChange={(e) => handleChange('mode', e.target.value)}
          >
            <option value="car">Car</option>
            <option value="taxi">Taxi</option>
            <option value="bus">Bus</option>
          </select>
        </div>

        <button type="submit" className="predict-btn" disabled={loading}>
          {loading ? 'Predicting...' : 'Predict Travel Time'}
        </button>
      </form>
    </div>
  );
};

export default Sidebar;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FlightFinder.css';

function FlightFinder({ tripId, trip }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    originAirport: '',
    returnAirport: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;


    const uppercaseValue = value.toUpperCase().slice(0, 3);

    setFormData(prev => ({
      ...prev,
      [name]: uppercaseValue
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.originAirport || !formData.returnAirport) {
      alert('Please enter both departure and return airports');
      return;
    }

    // Navigate to flights page with query parameters
    navigate(`/flights/${tripId}?origin=${encodeURIComponent(formData.originAirport)}&return=${encodeURIComponent(formData.returnAirport)}`);
  };

  return (
    <div className="flight-finder">
      <h2>Find Flights</h2>

      <form onSubmit={handleSubmit} className="flight-form">
        <div className="form-group">
          <label htmlFor="originAirport">Departure Airport</label>
          <input
            type="text"
            id="originAirport"
            name="originAirport"
            placeholder="Enter airport code (e.g., LAX)"
            value={formData.originAirport}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="returnAirport">Return Airport</label>
          <input
            type="text"
            id="returnAirport"
            name="returnAirport"
            placeholder="Enter airport code (e.g., JFK)"
            value={formData.returnAirport}
            onChange={handleChange}
            required
          />
        </div>

        <small className="helper-text">Use 3-letter airport codes for best results</small>

        <button type="submit">Find Flights</button>
      </form>
    </div>
  );
}

export default FlightFinder;
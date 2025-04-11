import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FlightFinderForm.css';

function FlightFinderForm({ tripId }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    originAirport: '',
    returnAirport: ''
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    const uppercaseValue = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    setFormData(prev => ({
      ...prev,
      [name]: uppercaseValue
    }));
    setFormError('');
  };

  // --- Shared Validation Logic ---
  const validateAirports = () => {
    if (!formData.originAirport || formData.originAirport.length !== 3 ||
      !formData.returnAirport || formData.returnAirport.length !== 3) {
      setFormError('Please enter valid 3-letter airport codes for both departure and return.');
      return false; // Validation failed
    }
    setFormError(''); // Clear error if valid
    return true; // Validation passed
  }

  // --- Handler for "Find Flights" button (submits the form) ---
  const handleFindFlightsSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    if (validateAirports()) {
      // Validation passed, move to view flights page
      console.log("Navigating to view flights with codes:", formData);
      navigate(`/flights/${tripId}?origin=${encodeURIComponent(formData.originAirport)}&return=${encodeURIComponent(formData.returnAirport)}`);
    }
  };

  // --- Handler for "Skip Flight Planning" button ---
  const handleSkipToGenerate = () => {
    if (validateAirports()) {
      // Validation passed, move DIRECTLY to itinerary review page
      console.log("Skipping flight view, navigating to itinerary generation with codes:", formData);
      navigate(`/review-itinerary/${tripId}?origin=${encodeURIComponent(formData.originAirport)}&return=${encodeURIComponent(formData.returnAirport)}`);
    }
  };

  return (
    // onSubmit defaults to finding flights
    <form onSubmit={handleFindFlightsSubmit} className="flight-finder-form">
      <div className="form-group">
        <label htmlFor="originAirport">Departure Airport Code</label>
        <input
          type="text" id="originAirport" name="originAirport" placeholder="e.g., LAX"
          value={formData.originAirport} onChange={handleChange} maxLength="3"
          autoComplete="off"
          required // Keep required as both buttons need valid input
        />
      </div>

      <div className="form-group">
        <label htmlFor="returnAirport">Return Airport Code</label>
        <input
          type="text" id="returnAirport" name="returnAirport" placeholder="e.g., JFK"
          value={formData.returnAirport} onChange={handleChange} maxLength="3"
          autoComplete="off"
          required // Keep required
        />
      </div>

      {formError && <p className="error-message form-error">{formError}</p>}

      <small className="helper-text">Enter 3-letter IATA airport codes.</small>

      <div className="flight-finder-actions two-buttons">
        {/* Find Flights Button (Type Submit) */}
        <button type="submit" className="btn btn-primary">
          Find Flights
        </button>
        {/* Skip Button (Type Button) */}
        <button
          type="button" // Prevents form submission
          className="btn btn-secondary skip-button"
          onClick={handleSkipToGenerate} // Use specific handler
        >
          Skip Viewing Flights & Generate Itinerary
        </button>
      </div>
    </form>
  );
}

export default FlightFinderForm;
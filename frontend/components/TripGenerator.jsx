import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/TripGenerator.css';

function TripGenerator() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    destination: '',
    duration: 3,
    budget: 'Medium',
    travelGroup: 'Solo Traveler'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/trips/generate-trip-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to trip details page with the new trip ID
        localStorage.setItem("lastTripId", data.tripId);
        navigate(`/trip/${data.tripId}`);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error generating trip:', error);
      alert('Failed to generate trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trip-generator-container">
      <h1>Plan Your Dream Trip</h1>
      <p>Let us create a personalized travel itinerary for you in seconds!</p>
      
      <form onSubmit={handleSubmit} className="trip-form">
        <div className="form-group">
          <label htmlFor="destination">Where do you want to go?</label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            placeholder="Enter city, country, or region"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="duration">How many days?</label>
          <input
            type="number"
            id="duration"
            name="duration"
            min="1"
            max="30"
            value={formData.duration}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="budget">What's your budget?</label>
          <select
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            required
          >
            <option value="Budget">Budget</option>
            <option value="Medium">Medium</option>
            <option value="Luxury">Luxury</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="travelGroup">Who are you traveling with?</label>
          <select
            id="travelGroup"
            name="travelGroup"
            value={formData.travelGroup}
            onChange={handleChange}
            required
          >
            <option value="Solo Traveler">Solo Traveler</option>
            <option value="Couple">Couple</option>
            <option value="Family with Kids">Family with Kids</option>
            <option value="Group of Friends">Group of Friends</option>
            <option value="Business Trip">Business Trip</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="generate-button"
          disabled={loading}
        >
          {loading ? 'Creating Your Trip...' : 'Generate Trip Plan'}
        </button>
      </form>
    </div>
  );
}

export default TripGenerator;
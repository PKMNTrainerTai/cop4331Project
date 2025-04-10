import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/SavedTrips.css';

function SavedTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSavedTrips = async () => {
      try {
        // Replace with your actual API endpoint to get saved trips
        const response = await fetch('http://localhost:5000/api/trips',{
            credentials: 'include',
        });
        const data = await response.json();
        
        if (response.ok) {
          setTrips(data.trips);
        } else {
          setError(data.message || 'Failed to load saved trips');
        }
      } catch (error) {
        console.error('Error fetching saved trips:', error);
        setError('Network error, please try again later');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedTrips();
  }, []);

  const deleteTrip = async (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/trips/${tripId}`, {
            credentials: 'include',
            method: 'DELETE',
        });
        
        if (response.ok) {
          // Remove the deleted trip from state
          setTrips(trips.filter(trip => trip._id !== tripId));
        } else {
          const data = await response.json();
          setError(data.message || 'Failed to delete trip');
        }
      } catch (error) {
        console.error('Error deleting trip:', error);
        setError('Network error, please try again later');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading your saved trips...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (trips.length === 0) {
    return (
      <div className="saved-trips-container empty-state">
        <h1>Your Saved Trips</h1>
        <div className="no-trips">
          <p>You haven't created any trips yet.</p>
          <Link to="/" className="create-trip-button">Plan Your First Trip</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-trips-container">
      <h1>Your Saved Trips</h1>
      
      <div className="trips-grid">
        {trips.map((trip) => (
          <div key={trip._id} className="trip-card">
            <div className="trip-card-header">
              <h2>{trip.destination}</h2>
              <div className="trip-meta">
                <span>{trip.duration} days</span>
                <span>{trip.budget} budget</span>
              </div>
            </div>
            
            <div className="trip-card-body">
              <p className="travel-group">{trip.travelGroup}</p>
              <p className="created-date">
                Created: {new Date(trip.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="trip-card-actions">
              <Link to={`/trip/${trip._id}`} className="view-button">
                View Details
              </Link>
              <button 
                onClick={() => deleteTrip(trip._id)} 
                className="delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <Link to="/" className="create-trip-button">Create New Trip</Link>
    </div>
  );
}

export default SavedTrips;
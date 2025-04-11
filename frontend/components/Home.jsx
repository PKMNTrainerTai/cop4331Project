import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import TripDetailsModal from './TripDetailsModal';
import './Home.css';

// Helper function to convert string to Title Case
function toTitleCase(str) {
  if (!str) return ''; // Handle null string
  return str.toLowerCase().replace(/([^\s'-])([^\s'-]*)/g, (match, firstChar, rest) => {
    // Capitalize the first letter of each word
    // Handles hyphens and apostrophes reasonably well
    return firstChar.toUpperCase() + rest;
  }).replace(/Mc(.)/g, (match, nextChar) => 'Mc' + nextChar.toUpperCase()); // Handle names like McDonald ??? I was eating McDonalds
}

function Home() {
  // Get user data from Layout -> ProtectedRoutes
  const userData = useOutletContext();
  const navigate = useNavigate();

  // Extract username
  const rawUserName = userData?.username || 'User';
  const userName = toTitleCase(rawUserName);

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTripData, setSelectedTripData] = useState(null);

  // Get Trips
  useEffect(() => {
    let isMounted = true;
    const fetchSavedTrips = async () => {
      setLoading(true); setError(null);
      try {
        const response = await fetch('http://localhost:5000/api/trips', { credentials: 'include' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Failed to load trips');
        if (isMounted) setTrips(data.trips);
      } catch (error) {
        console.error('Error fetching trips:', error);
        if (isMounted) setError(error.message || 'Network error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSavedTrips();
    return () => { isMounted = false; };
  }, []);

  // Delete Trips
  const deleteTrip = async (tripId) => {
    if (window.confirm('Are you sure you want to permanently delete this trip?')) {
      setError(null);
      try {
        const response = await fetch(`http://localhost:5000/api/trips/${tripId}`, { method: 'DELETE', credentials: 'include' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Failed to delete');
        setTrips(currentTrips => currentTrips.filter(trip => trip._id !== tripId));
      } catch (err) {
        console.error('Error deleting trip:', err);
        setError(`Delete failed: ${err.message}`);
      }
    }
  };

  // Modal Handlers
  const openTripModal = (trip) => { setSelectedTripData(trip); setIsModalOpen(true); };
  const closeTripModal = () => { setIsModalOpen(false); setSelectedTripData(null); };

  // Render Trip Content
  const renderTripContent = () => {
    if (loading) return <p className="loading-message">Loading your trips...</p>;
    if (error && trips.length === 0 && !loading) return <p className="error-message fetch-error">Error loading trips: {error}</p>;
    if (trips.length === 0 && !loading) return (<div className="no-trips-message"><p>You haven't planned any trips yet.</p></div>);

    return (
      <>
        {error && trips.length > 0 && <p className="error-message delete-error">Action failed: {error}</p>}
        <div className="trips-grid">
          {trips.map((trip) => {
            const locationName = typeof trip.location === 'string' ? trip.location : trip.location?.name;
            return (
              <div key={trip._id} className="trip-item trip-card" onClick={() => openTripModal(trip)} role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openTripModal(trip); }}>
                <h3>{trip.name || locationName || 'Unnamed Trip'}</h3>
                {locationName && <p><strong>Location:</strong> {locationName}</p>}
                {trip.startDate && trip.endDate && <p><strong>Dates:</strong> {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</p>}
                {trip.durationDays && <p><strong>Duration:</strong> {trip.durationDays} days</p>}
                <p className="created-date"> Created: {new Date(trip.createdAt).toLocaleDateString()} </p>
                <div className="trip-item-actions">
                  <button onClick={(e) => { e.stopPropagation(); deleteTrip(trip._id); }} className="btn btn-danger btn-sm delete-button" title="Delete Trip"> Delete </button>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    // Use Fragment to allow modal as a sibling
    <>
      <div className="home-container">
        <header className="home-header">
          <div>
            <h1>Welcome, {userName}!</h1>
            <p>Manage your planned trips below.</p>
          </div>
        </header>

        <main className="home-main">
          <div className="create-trip-action">
            <Link to="/create-trip" className="btn btn-primary"> + Create New Trip </Link>
          </div>
          <section className="trip-list-section">
            <h2>My Trips</h2>
            {renderTripContent()}
          </section>
        </main>
      </div>

      {isModalOpen && selectedTripData && (
        <TripDetailsModal tripData={selectedTripData} onClose={closeTripModal} />
      )}
    </>
  );
}

export default Home;
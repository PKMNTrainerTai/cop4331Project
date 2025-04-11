import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import FlightResultsDisplay from '../components/FlightResultsDisplay';
import './ViewFlightsPage.css';

function ViewFlightsPage() {
  const { tripId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const originAirport = queryParams.get('origin');
  const returnAirport = queryParams.get('return');

  const [trip, setTrip] = useState(null);
  const [flights, setFlights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);   // Clear errors
      setFlights(null); // Clear old flight data
      try {
        const tripResponse = await fetch(`http://localhost:5000/api/trips/${tripId}`, { credentials: 'include' });
        if (!tripResponse.ok) console.warn(`Failed to load trip details: ${tripResponse.status}`);
        else {
           const tripData = await tripResponse.json();
           setTrip(tripData.trip);
        }

        // Flight info
        const flightsResponse = await fetch(`http://localhost:5000/api/trip-flights/${tripId}?origin=${encodeURIComponent(originAirport)}&return=${encodeURIComponent(returnAirport)}`, { credentials: 'include' });
        const flightsData = await flightsResponse.json();
        if (!flightsResponse.ok) {
          throw new Error(flightsData.message || 'Failed to load flights');
        }
        setFlights(flightsData.data);

      } catch (error) {
        console.error('Error fetching flight data:', error);
        setError(error.message || 'An error occurred while loading flight information.');
      } finally {
        setLoading(false);
      }
    };

    if (tripId && originAirport && returnAirport) {
      fetchData();
    } else {
      setError('Missing trip ID or airport information.');
      setLoading(false);
    }
  }, [tripId, originAirport, returnAirport]);


  const handleGenerateItinerary = () => {
     if (!tripId || !originAirport || !returnAirport) return;
     navigate(`/review-itinerary/${tripId}?origin=${encodeURIComponent(originAirport)}&return=${encodeURIComponent(returnAirport)}`);
  };

  const renderMainContent = () => {
    if (loading) {
      return <div className="loading-indicator">Loading flight information...</div>;
    }
    if (error) {
      // Helpful error message and link
      return (
        <div className="error-display">
          <h3>Error Finding Flights</h3>
          <p>{error}</p>
          <Link to={`/trip/${tripId}/find-flights`} className="btn btn-secondary">Try Entering Airports Again</Link>
        </div>
      );
    }
    if (flights) {
      return <FlightResultsDisplay flightsData={flights} />;
    }
    return <div className="info-message">No flight information available.</div>;
  }

  return (
    <div className="page-container view-flights-page-container ">
      <button onClick={() => navigate(-1)} className="btn btn-back">←</button>
      <header className="page-header">
        {/* Use trip name if available */}
        <h2>Flights for {trip ? trip.name : 'Your Trip'}</h2>
        {originAirport && returnAirport && (
            <p className="search-context">Showing results for {originAirport} to {returnAirport}</p>
        )}
        <Link to={`/trip/${tripId}/find-flights`}>Change Airports</Link>
      </header>

      <main className="flights-content-area">
          {renderMainContent()}
      </main>

      {/* Only show "Next" button if flights were loaded successfully (or if no results but no error) */}
      {!loading && !error && (
        <div className="page-navigation-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerateItinerary}
          >
            Next: Generate Itinerary
          </button>
        </div>
      )}
    </div>
  );
}

export default ViewFlightsPage;
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import '../css/Flights.css';

function Flights() {
  const { tripId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const originAirport = queryParams.get('origin');
  const returnAirport = queryParams.get('return');

  const [trip, setTrip] = useState(null); // Still useful for context maybe
  const [flights, setFlights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get trip details
        const tripResponse = await fetch(`http://localhost:5000/api/trips/${tripId}`, { credentials: 'include' });
        const tripData = await tripResponse.json();
        if (!tripResponse.ok) throw new Error(tripData.message || 'Failed to load trip details');
        setTrip(tripData.trip);

        // Get flight info
        const flightsResponse = await fetch(`http://localhost:5000/api/trip-flights/${tripId}?origin=${encodeURIComponent(originAirport)}&return=${encodeURIComponent(returnAirport)}`, { credentials: 'include' });
        const flightsData = await flightsResponse.json();
        if (!flightsResponse.ok) throw new Error(flightsData.message || 'Failed to load flights');
        setFlights(flightsData.data);
      } catch (error) {
        console.error('Error:', error); setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (tripId && originAirport && returnAirport) { fetchData(); }
    else { setLoading(false); setError('Missing trip ID or airport information'); }
  }, [tripId, originAirport, returnAirport]);

  const handleGenerateItinerary = () => {
    if (!tripId || !originAirport || !returnAirport) return; // Should not happen if button is shown correctly
    // Navigate, airports == query params
    navigate(`/review-itinerary/${tripId}?origin=${encodeURIComponent(originAirport)}&return=${encodeURIComponent(returnAirport)}`);
  };

  if (loading) { return <div>Loading flight information...</div>; }

  if (error) {
    return (
      <div>
        <h2>Error Finding Flights</h2> <p>{error}</p>
        {/* Link back to the finder for this specific trip */}
        <Link to={`/trip/${tripId}/find-flights`}>Try Entering Airports Again</Link>
      </div>
    );
  }

  return (
    <div className="flights-page">
      <header className="flights-header">
        {/* Display trip name if available */}
        <h1>Flights for {trip ? trip.name : 'Your Trip'}</h1>
        {/* Link back to the finder for this specific trip */}
        <Link to={`/trip/${tripId}/find-flights`}>Change Airports</Link>
      </header>

      {/* Display flight search details */}
      {flights && flights.origin && (
        <div className="flight-search-details">
          <p><strong>From:</strong> {flights.origin} <strong>To:</strong> {flights.destination}</p>
          <p><strong>Dates:</strong> {new Date(flights.departDate).toLocaleDateString()} - {new Date(flights.returnDate).toLocaleDateString()}</p>
        </div>
      )}

      {/* Display flight results */}
      {flights && flights.best_flights && flights.best_flights.length > 0 ? (
        <div className="flight-results">
          <h2>Available Flights</h2>
          {flights.best_flights.map((flight, index) => (<div key={index} className="flight-card">
            <a href={flights.booking_link} target="_blank" rel="noopener noreferrer" className="book-button"> Book on Google </a> </div>))}
        </div>
      ) : (
        <div className="no-flights">
          <h2>No Flights Found</h2>
          <p>We couldn't find flights for {originAirport} to {returnAirport} on these dates.</p>
        </div>
      )}

      <div className="page-navigation-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerateItinerary}
        >
          Next: Generate Itinerary
        </button>
      </div>
    </div>
  );
}

export default Flights;
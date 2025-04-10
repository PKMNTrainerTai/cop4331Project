import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import '../css/Flights.css';

function Flights() {
  const { tripId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const originAirport = queryParams.get('origin');
  const returnAirport = queryParams.get('return');
  
  const [trip, setTrip] = useState(null);
  const [flights, setFlights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First fetch trip details
        const tripResponse = await fetch(`http://localhost:5000/api/trips/${tripId}`,{
            credentials: 'include',
        });
        const tripData = await tripResponse.json();
        
        if (!tripResponse.ok) {
          throw new Error(tripData.message || 'Failed to load trip details');
        }
        
        setTrip(tripData.trip);
        
        // Then fetch flight information
        const flightsResponse = await fetch(
          `http://localhost:5000/api/trip-flights/${tripId}?origin=${encodeURIComponent(originAirport)}&return=${encodeURIComponent(returnAirport)}`,{
            credentials: 'include',
          });
        const flightsData = await flightsResponse.json();
        
        if (!flightsResponse.ok) {
          throw new Error(flightsData.message || 'Failed to load flights');
        }
        
        setFlights(flightsData.data);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (originAirport && returnAirport) {
      fetchData();
    } else {
      setLoading(false);
      setError('Missing airport information');
    }
  }, [tripId, originAirport, returnAirport]);

  if (loading) {
    return <div>Loading flight information...</div>;
  }

  if (error) {
    return (
      <div>
        <h2>Error Finding Flights</h2>
        <p>{error}</p>
        <Link to={`/trip/${tripId}`}>Back to Trip Details</Link>
      </div>
    );
  }

  return (
    <div className="flights-page">
      <header>
        <h1>Flights for Your Trip</h1>
        <Link to={`/trip/${tripId}`}>Back to Trip</Link>
      </header>
      
      {flights && (
        <div className="flights-container">
          <div className="flight-search-details">
            <p><strong>From:</strong> {flights.origin} <strong>To:</strong> {flights.destination}</p>
            <p><strong>Dates:</strong> {new Date(flights.departDate).toLocaleDateString()} - {new Date(flights.returnDate).toLocaleDateString()}</p>
          </div>
          
          {flights.best_flights && flights.best_flights.length > 0 ? (
            <div className="flight-results">
              <h2>Available Flights</h2>
              {flights.best_flights.map((flight, index) => (
                <div key={index} className="flight-card">
                  <div className="flight-header">
                    <div className="airline-info">
                      <img src={flight.airline_logo} alt="Airline" className="airline-logo" />
                      <span className="airline-name">{flight.flights[0].airline}</span>
                    </div>
                    <span className="flight-price">${flight.price}</span>
                  </div>
                  
                  <div className="flight-overview">
                    <div className="flight-duration">
                      <div className="label">Duration</div>
                      <div className="value">{Math.floor(flight.total_duration/60)}h {flight.total_duration%60}m</div>
                    </div>
                    <div className="flight-stops">
                      <div className="label">Type</div>
                      <div className="value">
                        {flight.flights.length > 1 ? 
                          `${flight.flights.length-1} stop${flight.flights.length > 2 ? 's' : ''}` : 
                          'Nonstop'}
                      </div>
                    </div>
                    <div className="flight-type">
                      <div className="label">Class</div>
                      <div className="value">{flight.flights[0].travel_class || "Economy"}</div>
                    </div>
                  </div>
                  
                  <div className="flight-segments">
                    {flight.flights.map((segment, idx) => (
                      <div key={idx} className="flight-segment">
                        <div className="segment-header">
                          {idx > 0 && (
                            <div className="layover-info">
                              {flight.layovers && flight.layovers[idx-1] ? (
                                <span>Layover: {Math.floor(flight.layovers[idx-1].duration/60)}h {flight.layovers[idx-1].duration%60}m at {flight.layovers[idx-1].name}</span>
                              ) : (
                                <span>Connection</span>
                              )}
                            </div>
                          )}
                          <div className="flight-number">{segment.flight_number}</div>
                        </div>
                        
                        <div className="segment-timeline">
                          <div className="departure">
                            <div className="time">{segment.departure_airport?.time?.split(' ')[1]}</div>
                            <div className="date">{segment.departure_airport?.time?.split(' ')[0]}</div>
                            <div className="airport">{segment.departure_airport?.id}</div>
                            <div className="airport-name">{segment.departure_airport?.name}</div>
                          </div>
                          
                          <div className="flight-path">
                            <div className="duration">{Math.floor(segment.duration/60)}h {segment.duration%60}m</div>
                            <div className="path-line">
                              <div className="dot"></div>
                              <div className="line"></div>
                              <div className="dot"></div>
                            </div>
                            <div className="airplane">{segment.airplane || ""}</div>
                          </div>
                          
                          <div className="arrival">
                            <div className="time">{segment.arrival_airport?.time?.split(' ')[1]}</div>
                            <div className="date">{segment.arrival_airport?.time?.split(' ')[0]}</div>
                            <div className="airport">{segment.arrival_airport?.id}</div>
                            <div className="airport-name">{segment.arrival_airport?.name}</div>
                          </div>
                        </div>
                        
                        {segment.extensions && segment.extensions.length > 0 && (
                          <div className="flight-amenities">
                            {segment.extensions.map((ext, extIdx) => (
                              <span key={extIdx} className="amenity">{ext}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <a 
                    href={flights.booking_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="book-button"
                  >
                    Book on Google
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-flights">
              <h2>No Flights Found</h2>
              <p>We couldn't find any flights matching your search criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Flights;
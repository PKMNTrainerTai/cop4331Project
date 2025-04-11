import React from 'react';
import './FlightResultsDisplay.css';

// This component only receives flight data and renders it.
function FlightResultsDisplay({ flightsData }) {

  // Check if necessary data exists within the prop
  if (!flightsData || !flightsData.best_flights) {
    // This case should ideally be handled by the parent page before rendering this component,
    // but added as a safeguard.
    return <div className="no-flights">No flight data available to display.</div>;
  }

  const { best_flights, booking_link } = flightsData;

  if (best_flights.length === 0) {
    return <div className="no-flights">No flights found matching your criteria.</div>;
  }

  return (
    <div className="flight-results-display">
      {best_flights.map((flight, index) => (
        <div key={index} className="flight-card">
          <div className="flight-header">
            <div className="airline-info">
              <img src={flight.airline_logo} alt={flight.flights[0].airline || 'Airline'} className="airline-logo" />
              <span className="airline-name">{flight.flights[0].airline}</span>
            </div>
            <span className="flight-price">${flight.price}</span>
          </div>

          <div className="flight-overview">
            <div className="flight-duration">
              <div className="label">Duration</div>
              <div className="value">{Math.floor(flight.total_duration / 60)}h {flight.total_duration % 60}m</div>
            </div>
            <div className="flight-stops">
              <div className="label">Type</div>
              <div className="value">
                {flight.flights.length > 1 ?
                  `${flight.flights.length - 1} stop${flight.flights.length > 2 ? 's' : ''}` :
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
                      {flight.layovers && flight.layovers[idx - 1] ? (
                        <span>Layover: {Math.floor(flight.layovers[idx - 1].duration / 60)}h {flight.layovers[idx - 1].duration % 60}m at {flight.layovers[idx - 1].name}</span>
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
                    <div className="duration">{Math.floor(segment.duration / 60)}h {segment.duration % 60}m</div>
                    <div className="path-line">
                      <div className="dot"></div><div className="line"></div><div className="dot"></div>
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
          {booking_link && (
            <a
              href={booking_link}
              target="_blank"
              rel="noopener noreferrer"
              className="book-button"
            >
              Book on Google
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export default FlightResultsDisplay;
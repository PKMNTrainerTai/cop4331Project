import React from 'react';
import './ItineraryDisplay.css';

function ItineraryDisplay({ itineraryData }) {
  if (!itineraryData) {
    return <p>No itinerary data provided.</p>;
  }

  const {
    tripName,
    location,
    hotels = [],
    itinerary = {},
    budgetSummary = {}
  } = itineraryData;

  const renderAddress = (address) => {
    if (!address || address.toLowerCase() === 'tbd') return null;
    if (!address.match(/\d/)) return <p className="address-note">Address details unavailable.</p>;
    return <p className="address">📍 {address}</p>;
  }

  // Render simple time slot activities
  const renderDayActivities = (dayData) => {
    // Get the keys like 'morning', 'afternoon', 'evening'
    const timeSlots = Object.keys(dayData).filter(key => key !== 'theme'); // No theme allowed

    if (timeSlots.length === 0) {
      return <p className="description">No specific activities listed for this day.</p>;
    }

    return timeSlots.map(slotKey => {
      const activityDescription = dayData[slotKey];
      if (!activityDescription) return null; // Skip empty slots

      return (
        <div key={slotKey} className="timeslot-activity">
          <h5 className="timeslot-title">{slotKey.charAt(0).toUpperCase() + slotKey.slice(1)}</h5>
          <p className="description">{activityDescription}</p>
        </div>
      );
    });
  };

  return (
    <div className="itinerary-display-container">
      {tripName && <h2 className="itinerary-title">{tripName}</h2>}
      {location && <p className="itinerary-location">Destination: {location}</p>}

      {/* Hotel Recommendations */}
      {hotels.length > 0 && (
        <section className="itinerary-section hotels-section">
          <h3>Hotel Recommendations</h3>
          <div className="card-grid">
            {hotels.map((hotel, index) => (
              <div key={index} className="card hotel-card">
                <h4>{hotel.name}</h4>
                {renderAddress(hotel.address)} {/* Use renderAddress if hotels have it */}
                <p className="description">{hotel.notes || hotel.description}</p> {/* Adapt field name */}
                {hotel.estimatedCostPerNight && <p className="cost">Est. ${hotel.estimatedCostPerNight}/night</p>}
                {hotel.priceRange && !hotel.estimatedCostPerNight && <p className="cost">Price: {hotel.priceRange}</p>} {/* Show priceRange if cost is missing */}
                {hotel.rating && <p className="rating">Rating: {hotel.rating} Stars</p>} {/* Show rating */}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Daily Itinerary */}
      {Object.keys(itinerary).length > 0 && (
        <section className="itinerary-section daily-section">
          <h3>Daily Plan</h3>
          {Object.entries(itinerary).map(([dayKey, dayData]) => (
            <div key={dayKey} className="day-plan">
              <h4>
                {/* Capitalize 'day' and add number */}
                {dayKey.charAt(0).toUpperCase() + dayKey.slice(1).replace(/(\d+)/, ' $1')}
                {dayData.theme && `: ${dayData.theme}`}
              </h4>
              {/* Render activities based on time slots */}
              <div className="day-activities-container">
                {renderDayActivities(dayData)}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Budget Summary */}
      {Object.keys(budgetSummary).length > 0 && (
        <section className="itinerary-section budget-section">
          <h3>Budget Summary</h3>
          <ul className="budget-list">
            {Object.entries(budgetSummary).map(([category, cost]) => (
              <li key={category} className={`budget-item ${category === 'total' ? 'total' : ''}`}>
                <span className="category">{category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                {/* Directly display the cost value */}
                <span className="cost">${cost}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default ItineraryDisplay;
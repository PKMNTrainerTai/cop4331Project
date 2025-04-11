import React from 'react';
import ItineraryDisplay from './ItineraryDisplay';
import './TripDetailsModal.css';

function TripDetailsModal({ tripData, onClose }) {
  // No tripData == no render
  if (!tripData) {
    return null;
  }

  // Handle clicking the overlay or close button
  const handleClose = (e) => {
    // Close if clicking either
    if (e.target.id === 'modal-overlay' || e.target.id === 'modal-close-button') {
      onClose();
    }
  };

  const {
    name = 'Trip Details',
    location,
    startDate,
    endDate,
    partySize,
    budget,
    pace,
    createdAt,
    generatedItinerary
  } = tripData;

  const locationName = typeof location === 'string' ? location : location?.name;

  return (
    <div id="modal-overlay" className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="trip-modal-title">
        <button id="modal-close-button" className="modal-close-button" onClick={handleClose} aria-label="Close trip details">×</button>

        {/* Display Basic Trip Info */}
        <div className="modal-trip-info">
          <h2 id="trip-modal-title">{name || locationName || 'Trip Details'}</h2>
          {locationName && <p><strong>Destination:</strong> {locationName}</p>}
          {startDate && endDate && <p><strong>Dates:</strong> {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>}
          {partySize && <p><strong>Party:</strong> {partySize.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>}
          {budget && <p><strong>Budget:</strong> ${budget}</p>}
          {pace && <p><strong>Pace:</strong> {pace}</p>}
          {createdAt && <p className="created-date-modal">Created: {new Date(createdAt).toLocaleDateString()}</p>}
        </div>

        <hr className="modal-divider" />

        {/* Display Generated Itinerary (if it exists) */}
        {generatedItinerary ? (
          <div className="modal-itinerary-section">
            <h3>Generated Itinerary</h3>
            <ItineraryDisplay itineraryData={generatedItinerary} />
          </div>
        ) : (
          <p className="no-itinerary-message">No detailed itinerary was generated or saved for this trip.</p>
        )}

      </div>
    </div>
  );
}

export default TripDetailsModal;
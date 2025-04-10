import React from 'react';
import Flights from '../components/Flights';

function FlightsPage() {
  return (
    <div className="flights-page-container">
      <h1>Flight Options</h1>
      <Flights />
    </div>
  );
}

export default FlightsPage;
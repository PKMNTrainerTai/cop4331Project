import React from 'react';
import TripGenerator from '../components/TripGenerator';
import HeaderTabs from '../components/HeaderTabs'

function TripGeneratorPage() {
  return (
    <div>
        <HeaderTabs/>
      <h1>Plan Your Trip</h1>
      <TripGenerator />
    </div>
  );
}

export default TripGeneratorPage;
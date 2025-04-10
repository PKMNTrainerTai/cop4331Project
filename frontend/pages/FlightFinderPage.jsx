import React from 'react';
import { useParams } from 'react-router-dom';
import FlightFinder from '../components/FlightFinder';

function FlightFinderPage() {
  const { tripId } = useParams();
  
  return (
    <div>
      <h1>Find Flights</h1>
      <FlightFinder tripId={tripId} />
    </div>
  );
}

export default FlightFinderPage;
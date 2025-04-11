import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import FlightFinderForm from '../components/FlightFinderForm';
import './FindFlightsPage.css';

function FindFlightsPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  if (!tripId) {
    return <div className="page-container error">Error: Trip ID not found. <Link to="/home">Go Home</Link></div>;
  }

  return (
    <div className="page-container find-flights-page-container ">
      <button onClick={() => navigate(-1)} className="btn btn-back">←</button>
      <header className="page-header">
        <h2>Find Flights for Your Trip</h2>
        <p>Enter your preferred departure and return airport codes below.</p>
      </header>
      <main>
        <FlightFinderForm tripId={tripId} />
      </main>
    </div>
  );
}

export default FindFlightsPage;
import React from 'react';
import { useParams } from 'react-router-dom';
import HeaderTabs from '../components/HeaderTabs'
import TripDetails from '../components/TripDetails';

function TripDetailsPage() {
  const { tripId } = useParams();
  
  return (
    <div>
        <HeaderTabs/>
      <TripDetails tripId={tripId} />
    </div>
  );
}

export default TripDetailsPage;
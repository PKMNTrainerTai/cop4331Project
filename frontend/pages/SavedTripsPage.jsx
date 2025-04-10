import React from 'react';
import SavedTrips from '../components/SavedTrips';
import HeaderTabs from '../components/HeaderTabs'

const SavedTripsPage = () => {

    return(
        
     <div>
        <HeaderTabs/>
        <h1>Saved Trips</h1>
        <SavedTrips />
     </div>   
    )
}
export default SavedTripsPage;
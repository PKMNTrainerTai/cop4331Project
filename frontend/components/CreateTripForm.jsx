import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CreateTripForm.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    // Added a check for valid center array
    if (center && Array.isArray(center) && center.length === 2 && typeof center[0] === 'number' && typeof center[1] === 'number') {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

function CreateTripForm() {
  const navigate = useNavigate();
  // State variables
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [partySize, setPartySize] = useState('just_me');
  const [budget, setBudget] = useState('');
  const [pace, setPace] = useState('relaxed');
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResultId, setSelectedResultId] = useState(null);
  const [confirmedLocation, setConfirmedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null); // Start as null
  const [mapZoom, setMapZoom] = useState(2); // Default zoom
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // --- Get today's date for min attribute ---
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayString = getTodayString();

  // --- handleLocationSearch function ---
  const handleLocationSearch = async () => {
    if (!locationSearchTerm.trim()) {
      setSearchError('Please enter a location name to search.'); return;
    }
    setIsSearching(true); setSearchError(''); setSearchResults([]);
    setSelectedResultId(null); setConfirmedLocation(null); setMapCenter(null); setMapZoom(2); // Reset map state too
    const encodedLocation = encodeURIComponent(locationSearchTerm.trim());
    const apiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodedLocation}&count=3&language=en&format=json`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`Network error: ${response.status}`);
      const data = await response.json();
      if (data?.results?.length > 0) {
        const formattedResults = data.results.map(result => ({
          id: result.id, name: result.name, admin1: result.admin1 || '', country: result.country || '',
          displayName: `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}${result.country ? `, ${result.country}` : ''}`,
          lat: result.latitude, lng: result.longitude,
        }));
        setSearchResults(formattedResults);
      } else { setSearchError(`Could not find "${locationSearchTerm}".`); }
    } catch (error) { console.error('Geocoding error:', error); setSearchError('Failed to fetch location data.'); }
    finally { setIsSearching(false); }
  };

  // --- handleSelectLocation function ---
  const handleSelectLocation = (result) => {
    if (!result || isSubmitting) return; // Prevent selection during submission
    console.log("Selected:", result);
    setSelectedResultId(result.id);
    setConfirmedLocation({ name: result.displayName, lat: result.lat, lng: result.lng });
    setMapCenter([result.lat, result.lng]);
    setMapZoom(10); // Zoom in on selection
    setSearchError('');
  };

  // --- handleSubmit function (Saves trip first) ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true); setSubmitError('');

    // Validations
    if (!confirmedLocation) { setSubmitError('Please search for and select a destination.'); setIsSubmitting(false); return; }
    if (!tripName || !startDate || !endDate || !budget) { setSubmitError('Please fill in all required trip details.'); setIsSubmitting(false); return; }
    if (new Date(endDate) < new Date(startDate)) { setSubmitError('End date cannot be before start date.'); setIsSubmitting(false); return; }

    const start = new Date(startDate); const end = new Date(endDate);
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const initialTripData = { name: tripName, location: confirmedLocation, startDate, endDate, partySize, budget, pace, durationDays };
    console.log('Attempting to save initial trip data:', initialTripData);

    try {
      const response = await fetch('http://localhost:5000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send auth cookie
        body: JSON.stringify(initialTripData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save initial trip');
      }

      const newTripId = data.tripId; // Expecting tripId in response
      console.log("Trip saved with ID:", newTripId);

      if (!newTripId) throw new Error("Backend did not return a trip ID.");

      navigate(`/trip/${newTripId}/find-flights`); // Navigate using the ID

    } catch (err) {
      console.error('Failed to save initial trip:', err);
      setSubmitError(err.message || 'An error occurred while saving the trip.');
      setIsSubmitting(false);
    }
  };

  // Provide a sensible default center for initial map load
  const initialMapCenter = [30, 0];

  return (
    <div className="create-trip-container">
      <div className="create-trip-form-wrapper">
        <form onSubmit={handleSubmit}>
          {submitError && <p className="error-message submit-error">{submitError}</p>}

          {/* Trip Name */}
          <div className="form-group">
            <label htmlFor="tripName">Trip Name</label>
            <input type="text" id="tripName" value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="e.g., Summer Beach Vacation" required disabled={isSubmitting} />
          </div>

          {/* Location Search */}
          <div className="form-group">
            <label htmlFor="locationSearch">Destination Search</label>
            <div className="location-search-group">
              <input type="text" id="locationSearch" value={locationSearchTerm} onChange={(e) => setLocationSearchTerm(e.target.value)} placeholder="Enter city or place name" disabled={isSubmitting || isSearching} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLocationSearch(); } }} />
              <button type="button" onClick={handleLocationSearch} className="btn btn-secondary search-button" disabled={isSubmitting || isSearching || !locationSearchTerm.trim()}>
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
            {searchError && <p className="error-message search-error">{searchError}</p>}
          </div>

          {/* Display Search Results */}
          {searchResults.length > 0 && !isSearching && (
            <div className="form-group search-results-group">
              <label>Select the correct location:</label>
              <ul className="search-results-list">
                {searchResults.map((result) => (
                  <li key={result.id} className={`result-item ${selectedResultId === result.id ? 'selected' : ''}`} onClick={() => handleSelectLocation(result)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleSelectLocation(result); } }}>
                    {result.displayName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Map Display */}
          <div className="form-group map-group">
            <label>Map Preview {confirmedLocation ? `(${confirmedLocation.name})` : ''}</label>
            <div className="map-container">
              {/* Provide default center prop */}
              <MapContainer
                key={mapCenter ? mapCenter.join(',') : 'initial-map'}
                center={mapCenter || initialMapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}>
                <ChangeMapView center={mapCenter} zoom={mapZoom} />
                <TileLayer attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {mapCenter && confirmedLocation && (<Marker position={mapCenter}><Popup>{confirmedLocation.name}</Popup></Marker>)}
              </MapContainer>
            </div>
          </div>

          {/* Dates */}
          <div className="form-group date-group">
            <div>
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={isSubmitting}
                min={todayString}
              />
            </div>
            <div>
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={isSubmitting}
                min={startDate || todayString} // Use start date if selected, otherwise today
              />
            </div>
          </div>

          {/* Party Size */}
          <div className="form-group">
            <label>Who's Going?</label>
            <div className="radio-group">
              {['me', 'couple', 'friends', 'family'].map(size => (<label key={size}><input type="radio" name="partySize" value={size} checked={partySize === size} onChange={(e) => setPartySize(e.target.value)} disabled={isSubmitting} />{size.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>))}
            </div>
          </div>

          {/* Budget */}
          <div className="form-group">
            <label htmlFor="budget">Estimated Budget ($)</label>
            <input type="number" id="budget" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g., 1500" min="0" required disabled={isSubmitting} />
          </div>

          {/* Pace */}
          <div className="form-group">
            <label>Desired Pace</label>
            <div className="radio-group">
              <label><input type="radio" name="pace" value="relaxed" checked={pace === 'relaxed'} onChange={(e) => setPace(e.target.value)} disabled={isSubmitting} /> Relaxed</label>
              <label><input type="radio" name="pace" value="moderate" checked={pace === 'moderate'} onChange={(e) => setPace(e.target.value)} disabled={isSubmitting} /> Moderate</label>
              <label><input type="radio" name="pace" value="packed" checked={pace === 'packed'} onChange={(e) => setPace(e.target.value)} disabled={isSubmitting} /> Packed</label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/home')} disabled={isSubmitting}> Cancel </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || isSearching || !confirmedLocation}> {isSubmitting ? 'Saving Trip...' : 'Save Trip & Find Flights'} </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTripForm;
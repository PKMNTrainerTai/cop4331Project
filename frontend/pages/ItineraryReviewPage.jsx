import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import ItineraryDisplay from '../components/ItineraryDisplay';
import '../css/ItineraryReviewPage.css';

function ItineraryReviewPage() {
  const { tripId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const originAirport = queryParams.get('origin');
  const returnAirport = queryParams.get('return');

  const [generatedItineraryData, setGeneratedItineraryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!tripId) {
      if (isMounted) {
        setError("Missing Trip ID in URL.");
        setIsLoading(false);
      }
      return; // Stop if missing
    }

    const generateItinerary = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError('');

      const generationApiUrl = `http://localhost:5000/api/trips/generate-itinerary/${tripId}`;

      try {
        console.log(`Requesting itinerary generation for trip ${tripId} (Airports: ${originAirport}/${returnAirport})...`);
        const response = await fetch(generationApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            originAirport: originAirport,
            returnAirport: returnAirport,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to generate itinerary via backend');
        }
        if (isMounted) {
          if (!data.itineraryData || typeof data.itineraryData !== 'object') {
            throw new Error("Backend response missing valid itinerary data.");
          }
          setGeneratedItineraryData(data.itineraryData);
        }
      } catch (err) {
        console.error("Error requesting itinerary generation:", err);
        if (isMounted) {
          setError(err.message || "Failed to generate itinerary. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    generateItinerary();

    return () => { isMounted = false; };

  }, [tripId, originAirport, returnAirport]);

  // Handle final save
  const handleConfirmAndSave = async () => {
    if (!generatedItineraryData || !tripId) { setError("Cannot save, missing itinerary data or trip ID."); return; }
    setIsSaving(true); setError('');
    const updateApiUrl = `http://localhost:5000/api/trips/${tripId}/itinerary`;
    try {
      const response = await fetch(updateApiUrl, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ itinerary: generatedItineraryData }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) { throw new Error(data.message || 'Failed to update trip'); }
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('Failed to update trip with itinerary:', err);
      setError(err.message || 'An error occurred while saving the itinerary.');
      setIsSaving(false);
    }
  };

  // Construct the link back to the flights page
  const getFlightsLink = () => {
    if (!tripId || !originAirport || !returnAirport) return '#';
    return `/flights/${tripId}?origin=${encodeURIComponent(originAirport)}&return=${encodeURIComponent(returnAirport)}`;
  }

  // Render
  const renderContent = () => {
    if (isLoading) {
      return <div className="loading-indicator">Generating your itinerary, please wait... This may take a moment.</div>;
    }
    if (error && !generatedItineraryData) { // Show error only if can't get data
      return <div className="error-display generation-error">{error}</div>;
    }
    if (generatedItineraryData) {
      return <ItineraryDisplay itineraryData={generatedItineraryData} />;
    }
    return <div className="info-message">Could not load itinerary data. Please go back and try again.</div>;
  };


  return (
    <div className="page-container review-page-container ">
      <button onClick={() => navigate(-1)} className="btn btn-back">←</button>
      <header className="review-header">
        <h2>Review Your Generated Itinerary</h2>
        <p>For Trip ID: {tripId || 'N/A'}</p>
        {(originAirport && originAirport !== 'N/A' && returnAirport && returnAirport !== 'N/A') ? (
          <p>Airports: {originAirport} → {returnAirport}</p>
        ) : (
          <p>Flight planning skipped.</p>
        )}
      </header>

      <main className="review-content-area">
        {renderContent()}
      </main>

      {error && isSaving && <p className="error-message save-error">{error}</p>}

      <div className="page-navigation-actions review-actions">
        <button
          type="button" className="btn btn-secondary"
          onClick={() => navigate(getFlightsLink())}
          disabled={isSaving || isLoading}
        >
          Back to Flights/Finder
        </button>
        {!isLoading && !error && generatedItineraryData && (
          <button
            type="button" className="btn btn-primary"
            onClick={handleConfirmAndSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Looks Good! Add to Trip'}
          </button>
        )}
      </div>
    </div>
  );
}

export default ItineraryReviewPage;
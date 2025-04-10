import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import FlightFinder from '../components/FlightFinder';
import '../css/TripDetails.css';

function TripDetails() {
    const { tripId } = useParams();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeDay, setActiveDay] = useState(1);

    useEffect(() => {
        const fetchTripDetails = async () => {
            try {
                // Replace with your actual API endpoint to get trip details
                const response = await fetch(`http://localhost:5000/api/trips/${tripId}`,{
                    credentials: 'include'
                });
                
                const data = await response.json();

                if (response.ok) {
                    setTrip(data.trip);
                } else {
                    setError(data.message || 'Failed to load trip details');
                }
            } catch (error) {
                console.error('Error fetching trip:', error);
                setError('Network error, please try again later');
            } finally {
                setLoading(false);
            }
        };

        fetchTripDetails();
    }, [tripId]);

    function createHotelBookingLink(accommodation, destination) {
        const searchTerm = `${accommodation.name} ${accommodation.address} ${destination}`;
        return `https://www.google.com/travel/hotels/search?q=${encodeURIComponent(searchTerm)}`;
      }

    if (loading) {
        return <div className="loading">Loading trip details...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    if (!trip) {
        return <div className="error">Trip not found</div>;
    }

    return (
        <div className="trip-details-container">
            <div className="trip-header">
                <h1>{trip.destination}</h1>
                <div className="trip-meta">
                    <span>{trip.duration} days</span>
                    <span>{trip.budget} budget</span>
                    <span>{trip.travelGroup}</span>
                </div>
            </div>

            <div className="trip-content">
                <div className="sidebar">
                    <div className="accommodations-section">
                        <h2>Recommended Accommodations</h2>
                        <div className="accommodations-list">
                            {trip.accommodations.map((accommodation, index) => {
                                // Create Google search URL for the hotel
                                const googleSearchUrl = createHotelBookingLink(accommodation, trip.destination);

                                return (
                                    <a
                                        key={index}
                                        href={googleSearchUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="accommodation-card"
                                    >
                                        <h3>{accommodation.name}</h3>
                                        <p className="address">{accommodation.address}</p>
                                        <div className="accommodation-details">
                                            <span className="price">{accommodation.priceRange}</span>
                                            <span className="rating">⭐ {accommodation.rating}</span>
                                        </div>
                                        <div className="book-now-badge">
                                            <span>Book Now</span>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    <FlightFinder trip={trip} tripId={tripId} />
                </div>

                <div className="itinerary-section">
                    <h2>Your Itinerary</h2>

                    <div className="day-tabs">
                        {trip.itinerary.map((day) => (
                            <button
                                key={day.day}
                                className={activeDay === day.day ? 'active' : ''}
                                onClick={() => setActiveDay(day.day)}
                            >
                                Day {day.day}
                            </button>
                        ))}
                    </div>

                    <div className="day-activities">
                        {trip.itinerary.filter(day => day.day === activeDay).map((day) => (
                            <div key={day.day} className="activities-list">
                                {day.activities.map((activity, index) => (
                                    <div key={index} className="activity-card">
                                        <div className="activity-time">{activity.timeSlot}</div>
                                        <div className="activity-content">
                                            <h3>{activity.name}</h3>
                                            <p>{activity.description}</p>
                                            <div className="activity-details">
                                                <span className="duration">{activity.duration}</span>
                                                <span className="cost">
                                                    {activity.isFree ? 'Free' : activity.cost}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TripDetails;
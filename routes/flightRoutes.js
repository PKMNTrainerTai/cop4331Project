const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { authenticateMiddleware } = require('../middleware/middleware'); // Ensure middleware path is correct

module.exports = function(client) {

  // GET /api/trip-flights/:tripId - Find flights based on stored trip dates
  router.get('/trip-flights/:tripId', authenticateMiddleware, async (req, res) => {
    const { tripId } = req.params;
    const { origin, return: returnAirport } = req.query; // 'return' is a reserved word, need destructuring alias

    // Validate inputs
    if (!ObjectId.isValid(tripId)) {
        return res.status(400).json({ success: false, message: "Invalid Trip ID format" });
    }
    if (!origin || !returnAirport) {
      return res.status(400).json({
        success: false,
        message: "Both departure (origin) and return airports are required query parameters."
      });
    }
    // Basic check for 3-letter codes (can be enhanced)
    if (!/^[A-Z]{3}$/i.test(origin) || !/^[A-Z]{3}$/i.test(returnAirport)) {
       return res.status(400).json({ success: false, message: "Airport codes must be 3 letters." });
    }


    try {
      const db = client.db();
      const userId = req.user.userId; // Get userId from middleware

      // Fetch the trip details to get the dates
      const trip = await db.collection('trips').findOne({
        _id: new ObjectId(tripId),
        userId: userId // Ensure the logged-in user owns this trip
      });

      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Trip not found or you do not have permission to access it."
        });
      }

      // *** Use the start and end dates stored in the trip document ***
      const departDate = trip.startDate;
      const returnDateString = trip.endDate;

      // Validate the fetched dates
      if (!departDate || !returnDateString || !/^\d{4}-\d{2}-\d{2}$/.test(departDate) || !/^\d{4}-\d{2}-\d{2}$/.test(returnDateString)) {
          console.error(`Trip ${tripId} has invalid stored dates: Start='${departDate}', End='${returnDateString}'`);
          return res.status(400).json({ success: false, message: "The trip has invalid start or end dates stored. Please check the trip details." });
      }
      // Optional: Check if dates are in the past? Depends on requirements.
      // const todayStr = new Date().toISOString().split('T')[0];
      // if (departDate < todayStr) { ... handle past date ... }

      console.log(`Searching flights for Trip ${tripId}: ${origin} -> ${returnAirport}, Depart: ${departDate}, Return: ${returnDateString}`);

      // Construct parameters for SerpApi using trip dates
      const params = {
        api_key: process.env.SERP_API_KEY, // Ensure this is in your .env file
        engine: "google_flights",
        hl: "en", // Language
        gl: "us", // Country (optional)
        departure_id: origin.toUpperCase(), // Ensure uppercase
        arrival_id: returnAirport.toUpperCase(), // Ensure uppercase
        outbound_date: departDate,      // Use trip's start date
        return_date: returnDateString,  // Use trip's end date
        currency: "USD",
        adults: 1, // Assuming 1 adult for now, could get from trip.partySize later if needed
        // 'type: 2' can sometimes force round trip results if API has issues
      };

      // Make the call to SerpApi
      const searchUrl = `https://serpapi.com/search?${new URLSearchParams(params)}`;
      console.log("Calling SerpApi:", searchUrl); // Log the URL for debugging (remove API key if logging publicly)
      const response = await fetch(searchUrl);

      if (!response.ok) {
        const errorBody = await response.text(); // Get error body for more details
        console.error(`SerpApi Error ${response.status}: ${errorBody}`);
        throw new Error(`Flight API responded with status: ${response.status}. Check backend logs for details.`);
      }

      const data = await response.json();

       // Check for errors reported within the SerpApi JSON response
       if (data.error) {
           console.error("SerpApi reported an error:", data.error);
           throw new Error(`Flight API Error: ${data.error}`);
       }

      // Format the response consistently for the frontend
      // (Structure based on the frontend FlightResultsDisplay component expectations)
      const formattedFlights = {
        // Include search parameters for context on the frontend
        origin: origin.toUpperCase(),
        destination: returnAirport.toUpperCase(),
        departDate: departDate,
        returnDate: returnDateString,
        // Extract relevant data points from SerpApi response
        best_flights: data.best_flights || [],
        // Note: SerpApi structure might vary. 'other_flights' might also contain results.
        // Adjust based on actual SerpApi responses you receive.
        // flights: data.other_flights || [], // Example if 'other_flights' is relevant
        search_info: { // Example search metadata
          currency: data.search_parameters?.currency || "USD",
          // Add other useful metadata if available
        },
        // Construct a reasonable booking link (users often search again anyway)
        booking_link: `https://www.google.com/travel/flights?q=Flights%20from%20${encodeURIComponent(origin)}%20to%20${encodeURIComponent(returnAirport)}%20on%20${departDate}%20returning%20${returnDateString}`
      };

      return res.json({
        success: true,
        tripId, // Keep tripId for context if needed
        data: formattedFlights // Send the formatted data
      });

    } catch (error) {
      console.error(`Error processing /api/trip-flights/${tripId}:`, error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve flight information due to an internal server error.",
        // Avoid sending detailed stack trace in production
        // error: error.toString()
      });
    }
  });

  // GET /api/flights - Generic flight search (unauthenticated, potentially)
  // Keep this route as it was, it might be used elsewhere or for different features.
  // It doesn't rely on a saved trip.
  router.get('/flights', async (req, res) => {
    const { origin, destination, departDate, returnDate } = req.query;

    if (!origin || !destination || !departDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters (origin, destination, departDate)"
      });
    }

    try {
      const params = {
        api_key: process.env.SERP_API_KEY,
        engine: "google_flights",
        departure_id: origin.toUpperCase(),
        arrival_id: destination.toUpperCase(),
        outbound_date: departDate,
        return_date: returnDate || '', // Empty string if not provided
        currency: "USD",
        hl: "en",
        adults: 1,
      };

      const response = await fetch(`https://serpapi.com/search?${new URLSearchParams(params)}`);

      if (!response.ok) {
         const errorBody = await response.text();
         console.error(`SerpApi Error (generic search) ${response.status}: ${errorBody}`);
        throw new Error(`Generic Flight API responded with status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
           console.error("SerpApi reported an error (generic search):", data.error);
           throw new Error(`Generic Flight API Error: ${data.error}`);
       }

      const formattedFlights = {
        origin: data.search_parameters?.departure_id || origin.toUpperCase(),
        destination: data.search_parameters?.arrival_id || destination.toUpperCase(),
        departDate,
        returnDate: returnDate || null,
        best_flights: data.best_flights || [],
        // other_flights: data.other_flights || [], // Check actual API response structure
        search_info: {
          currency: data.search_parameters?.currency || "USD",
          // total_results: data.search_information?.total_results || 0
        },
        booking_link: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departDate}${returnDate ? `%20returning%20${returnDate}` : ''}`
      };

      return res.json({
        success: true,
        data: formattedFlights
      });

    } catch (error) {
      console.error("Generic flight search error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve flight information",
      });
    }
  });

  return router;
};
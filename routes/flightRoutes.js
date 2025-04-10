const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { authenticateMiddleware } = require('../middleware/middleware');

module.exports = function(client) {
  router.get('/trip-flights/:tripId', authenticateMiddleware, async (req, res) => {
    const { tripId } = req.params;
    const { origin, return: returnAirport } = req.query;
    
    if (!origin || !returnAirport) {
      return res.status(400).json({ 
        success: false, 
        message: "Both departure and return airports are required" 
      });
    }
    
    try {
      const db = client.db();
      const trip = await db.collection('trips').findOne({ 
        _id: new ObjectId(tripId),
        userId: req.user.userId
      });
      
      if (!trip) {
        return res.status(404).json({ 
          success: false, 
          message: "Trip not found" 
        });
      }
      
      const today = new Date();
      const departDate = today.toISOString().split('T')[0];
      
      const returnDate = new Date(today);
      returnDate.setDate(today.getDate() + trip.duration);
      const returnDateString = returnDate.toISOString().split('T')[0];
      
      const params = {
        api_key: process.env.SERP_API_KEY,
        engine: "google_flights",
        departure_id: origin,
        arrival_id: returnAirport,
        outbound_date: departDate,
        return_date: returnDateString,
        currency: "USD",
        hl: "en",
        adults: 1
      };
      
      const response = await fetch(`https://serpapi.com/search?${new URLSearchParams(params)}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const formattedFlights = {
        origin: origin,
        destination: returnAirport,
        departDate,
        returnDate: returnDateString,
        best_flights: data.best_flights || [],
        flights: data.flights_results?.results || [],
        search_info: {
          currency: data.search_metadata?.currency || "USD",
          total_results: data.search_information?.total_results || 0
        },
        booking_link: `https://www.google.com/travel/flights?q=Flights%20from%20${encodeURIComponent(origin)}%20to%20${encodeURIComponent(returnAirport)}%20on%20${departDate}%20returning%20${returnDateString}`
      };
      
      return res.json({
        success: true,
        tripId,
        data: formattedFlights
      });
      
    } catch (error) {
      console.error("Trip flights error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve flight information",
        error: error.message
      });
    }
  });

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
        departure_id: origin,
        arrival_id: destination,
        outbound_date: departDate,
        return_date: returnDate || '',
        currency: "USD",
        hl: "en",
        adults: 1,
        deep_search: false
      };
      
      const response = await fetch(`https://serpapi.com/search?${new URLSearchParams(params)}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const formattedFlights = {
        origin: data.search_metadata?.departure_id || origin,
        destination: data.search_metadata?.arrival_id || destination,
        departDate,
        returnDate: returnDate || null,
        best_flights: data.best_flights || [],
        flights: data.flights_results?.results || [],
        search_info: {
          currency: data.search_metadata?.currency || "USD",
          total_results: data.search_information?.total_results || 0
        },
        booking_link: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departDate}${returnDate ? `%20returning%20${returnDate}` : ''}`
      };
      
      return res.json({
        success: true,
        data: formattedFlights
      });
      
    } catch (error) {
      console.error("Flight search error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve flight information",
        error: error.message
      });
    }
  });

  return router;
};
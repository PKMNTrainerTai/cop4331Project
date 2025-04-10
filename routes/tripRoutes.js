const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { authenticateMiddleware } = require('../middleware/middleware');

module.exports = function(client, genAI) {
  router.use(authenticateMiddleware);
  
  router.get('/', async (req, res) => {
    try {
      const db = client.db();
      
      const userId = req.user.userId;
      
      const trips = await db.collection('trips')
        .find({ userId: userId })
        .sort({ createdAt: -1 })
        .toArray();
      
      return res.json({
        success: true,
        trips
      });
      
    } catch (error) {
      console.error("Error fetching saved trips:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve saved trips",
        error: error.message
      });
    }
  });

  router.get('/:tripId', async (req, res) => {
    const { tripId } = req.params;
    
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
      
      return res.json({
        success: true,
        trip
      });
      
    } catch (error) {
      console.error("Error fetching trip details:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve trip details",
        error: error.message
      });
    }
  });

  router.delete('/:tripId', async (req, res) => {
    const { tripId } = req.params;
    
    try {
      const db = client.db();
      
      const result = await db.collection('trips').deleteOne({ 
        _id: new ObjectId(tripId),
        userId: req.user.userId
      });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Trip not found or you don't have permission to delete it" 
        });
      }
      
      return res.json({
        success: true,
        message: "Trip deleted successfully"
      });
      
    } catch (error) {
      console.error("Error deleting trip:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete trip",
        error: error.message
      });
    }
  });

  router.post('/generate-trip-test', async (req, res) => {
    const { destination, duration, budget, travelGroup } = req.body;
    
    if (!destination || !duration || !budget || !travelGroup) {
      return res.status(400).json({ success: false, message: "Missing required trip details" });
    }
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Create a detailed ${duration}-day travel itinerary for ${destination} with a ${budget.toLowerCase()} budget for ${travelGroup.toLowerCase()}. Include:
  1. Recommended accommodations with price ranges and star ratings (4 options max)
  2. A day-by-day schedule with activities, including:
     - Time slots for each activity (morning, afternoon, evening)
     - Brief descriptions
     - Approximate costs
     - Duration of activities
  3. Consider the budget level (${budget}) when recommending activities and accommodations.
  
  Format the response as a JSON object with this structure:
  {
    "destination": "${destination}",
    "duration": ${duration},
    "budget": "${budget}",
    "travelGroup": "${travelGroup}",
    "accommodations": [
      {
        "name": "Hotel name",
        "address": "Address",
        "priceRange": "Price range",
        "rating": number,
        "coordinates": "latitude,longitude"
      }
    ],
    "itinerary": [
      {
        "day": 1,
        "activities": [
          {
            "name": "Activity name",
            "description": "Description",
            "timeSlot": "Time range (e.g., 10:00 AM - 12:00 PM)",
            "duration": "Duration in minutes or hours",
            "cost": "Cost information",
            "isFree": boolean
          }
        ]
      }
    ]
  }`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      const text = response.text();
      
      let jsonText = text;
      
      if (text.includes("```json")) {
        jsonText = text.replace(/```json\s*|\s*```/g, "");
      } else if (text.includes("```")) {
        jsonText = text.replace(/```\s*|\s*```/g, "");
      }
      
      try {
        const tripData = JSON.parse(jsonText);
        
        const db = client.db();
        
        const newTrip = {
          userId: req.user.userId,
          ...tripData,
          createdAt: new Date()
        };
        
        const savedTrip = await db.collection('trips').insertOne(newTrip);
        
        return res.status(201).json({ 
          success: true, 
          message: "Trip created successfully",
          tripId: savedTrip.insertedId,
          trip: newTrip
        });
        
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        
        return res.status(500).json({ 
          success: false, 
          message: "Error processing AI response",
          rawResponse: text,
          error: parseError.message
        });
      }
      
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to generate trip",
        error: error.message 
      });
    }
  });

  return router;
};
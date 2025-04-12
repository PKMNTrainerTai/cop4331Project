const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
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
      const userId = req.user.userId;

      if (!ObjectId.isValid(tripId)) {
          return res.status(400).json({ success: false, message: "Invalid Trip ID format" });
      }

      const trip = await db.collection('trips').findOne({
        _id: new ObjectId(tripId),
        userId: userId 
      });

      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Trip not found or access denied"
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
      const userId = req.user.userId;

       if (!ObjectId.isValid(tripId)) {
           return res.status(400).json({ success: false, message: "Invalid Trip ID format" });
       }

      const result = await db.collection('trips').deleteOne({
        _id: new ObjectId(tripId),
        userId: userId 
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

  router.post('/', async (req, res) => {
      const { name, location, startDate, endDate, partySize, budget, pace, durationDays } = req.body;
      const userId = req.user.userId;

      if (!name || !location || !startDate || !endDate || !partySize || !budget || !pace || !durationDays) {
          return res.status(400).json({ success: false, message: "Missing required trip details for initial save." });
      }

      try {
          const db = client.db();
          const newTrip = {
              userId: userId,
              name,
              location, 
              startDate,
              endDate,
              partySize,
              budget,
              pace,
              durationDays,
              generatedItinerary: null,    
              createdAt: new Date()
          };

          const result = await db.collection('trips').insertOne(newTrip);

          if (!result.insertedId) {
              throw new Error("Failed to insert trip into database.");
          }

          return res.status(201).json({
              success: true,
              message: "Trip created successfully",
              tripId: result.insertedId 
          });

      } catch (error) {
          console.error("Error creating initial trip:", error);
          return res.status(500).json({
              success: false,
              message: "Failed to create trip",
              error: error.message
          });
      }
  });

  
  router.post('/generate-itinerary/:tripId', async (req, res) => {
      const { tripId } = req.params;
      const { originAirport, returnAirport } = req.body; 
      const userId = req.user.userId;

      if (!originAirport || !returnAirport) {
          return res.status(400).json({ success: false, message: "Origin and return airports are required." });
      }
       if (!ObjectId.isValid(tripId)) {
           return res.status(400).json({ success: false, message: "Invalid Trip ID format" });
       }

      try {
          const db = client.db();

          const baseTripData = await db.collection('trips').findOne({
              _id: new ObjectId(tripId),
              userId: userId
          });

          if (!baseTripData) {
              return res.status(404).json({ success: false, message: "Trip not found or access denied." });
          }

          let partyDescription = "Just Me";
          if (baseTripData.partySize === 'couple') partyDescription = "a Couple (2 people)";
          else if (baseTripData.partySize === 'friends') partyDescription = "a Group of Friends";
          else if (baseTripData.partySize === 'family') partyDescription = "a Family";

          const prompt = `Generate a simple travel plan for the location: ${baseTripData.location.name}. It should be spread out over ${baseTripData.durationDays} days. It will be for ${partyDescription}. The estimated budget is $${baseTripData.budget}. The desired pace of travel is ${baseTripData.pace}. (Flight details: From ${originAirport}, Return ${returnAirport}).

          You must provide the plan in a JSON format, enclosed ONLY within a single \`\`\`json ... \`\`\` code block. Do not include any text before or after the JSON block.
          The JSON structure should include:
          - "tripName": "${baseTripData.name}" (string).
          - "duration": ${baseTripData.durationDays} (number).
          - "travelerCount": Based on "${partyDescription}".
          - "budget": ${baseTripData.budget} (number).
          - "pace": "${baseTripData.pace}" (string).
          - "location": "${baseTripData.location.name}" (string).
          - "hotels": An array of 2-3 hotel recommendations... (same structure as before)
          - "itinerary": An object where keys are "day1", "day2", etc.... (same structure as before)
          - "budgetSummary": An object summarizing estimated costs... (same structure as before)

          The plan should be well-made... (rest of prompt instructions remain the same)
         `;

          
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const generationConfig = { temperature: 0.8, topP: 0.9, topK: 40, maxOutputTokens: 8192 };
          const result = await model.generateContent(prompt);
          const response = result.response;
          const responseText = response.text();

          
          let generatedItineraryJson = null;
          const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
              try { generatedItineraryJson = JSON.parse(jsonMatch[1]); } catch (e) { throw new Error(`Failed to parse JSON within backticks: ${e.message}`); }
          } else {
              try { generatedItineraryJson = JSON.parse(responseText); } catch (e) { throw new Error(`Response was not valid JSON: ${e.message}`); }
          }
          if (!generatedItineraryJson || typeof generatedItineraryJson !== 'object') {
             throw new Error("Parsed Gemini response is not a valid JSON object.");
          }

          
          return res.json({
              success: true,
              itineraryData: generatedItineraryJson
          });

      } catch (error) {
          console.error("Error generating itinerary:", error);
          return res.status(500).json({
              success: false,
              message: "Failed to generate itinerary",
              error: error.message
          });
      }
  });




  router.put('/:tripId/itinerary', async (req, res) => {
      const { tripId } = req.params;
      const { itinerary } = req.body;
      const userId = req.user.userId;

      if (!itinerary || typeof itinerary !== 'object') {
          return res.status(400).json({ success: false, message: "Invalid or missing itinerary data in request body." });
      }
       if (!ObjectId.isValid(tripId)) {
           return res.status(400).json({ success: false, message: "Invalid Trip ID format" });
       }

      try {
          const db = client.db();

          const result = await db.collection('trips').updateOne(
              { _id: new ObjectId(tripId), userId: userId }, 
              { $set: { generatedItinerary: itinerary, updatedAt: new Date() } }
          );

          if (result.matchedCount === 0) {
              return res.status(404).json({ success: false, message: "Trip not found or access denied." });
          }
          if (result.modifiedCount === 0) {
              console.warn(`Trip ${tripId} itinerary update resulted in no changes.`);
          }

          return res.json({
              success: true,
              message: "Itinerary added successfully"
          });

      } catch (error) {
          console.error("Error updating trip with itinerary:", error);
          return res.status(500).json({
              success: false,
              message: "Failed to update trip",
              error: error.message
          });
      }
  });


  return router;
};
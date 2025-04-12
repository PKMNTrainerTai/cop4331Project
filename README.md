# cis4004Project
# Travelite - A faster way to plan

##Overview

- This project is a comprehensive travel planning web application that allows users to generate custom trip itineraries and find flights for their destinations.

## Features

- User authentication (signup, login, email verification)
- AI-powered trip generation based on destination, duration, budget, and travel group
- Detailed trip itineraries with daily activities and recommended accommodations
- Flight search functionality using Google Flights data
- Link to book hotels
- Responsive design for desktop and mobile devices

## Setup & Deployment

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google Gemini API key
- SerpAPI key (for flight search)

### Installation

1. Clone the repository

2. Install dependencies for both backend and frontend
- npm install
- cd frontend -> npm install

3. Create a `.env` file in the root directory with the following variables:

PORT=your_port_number
MONGO_URL=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
SENDGRID_API_KEY=your_sendgrid_key
SERP_API_KEY=your_serp_api_key
JWT_SECRET=your_jwt_secret
NODE_ENV=your_node_env

### Running the Application

1. Start the backend server (runs on port 5000)
-npm start

2. In a separate terminal, start the frontend (runs on port 5173)
-npm run dev

3. Access the application at `http://localhost:5173`

##Dev Dependencies
 - vite @vitejs/plugin-react
 - eslint @eslint/js
 - eslint-plugin-react-hooks 
 - eslint-plugin-react-refresh
 - @types/react 
 - @types/react-dom 
 - globals

##Frontend Dependencies
 - react 
 - react-dom 
 - react-router-dom 
 - @react-oauth/google 
 - @google/generative-ai 
 - react-icons 
 - js-cookie jwt-decode 
 - leaflet react-leaflet 

##Backend Dependencies
 - express 
 - cors 
 - dotenv 
 - body-parser 
 - cookie-parser crypto 
 - mongodb axios bcryptjs 
 - jsonwebtoken 
 - @sendgrid/mail 
 - google-auth-library 
 - mailtrap 
 - @google/generative-ai

## AI Usage Citation

### AI Used
- Claude 3.7 Sonnet
- ChatGPT 4o
- Usage:
   *Ideas for features
   *Help fix errors within our code
   *Some CSS assistance

### Prompts Used
- https://claude.ai/chat/39acd1eb-a1dc-4bb7-9714-223fa1319765
- https://chatgpt.com/share/67f9aad8-21a4-800d-97c0-aad9a764e25f
- Various follow-up questions about implementing flight search functionality, trip details, and UI components

### Components/Code Affected
- API endpoints:
- `/api/trip-flights/:tripId`
- `/api/flights`
- `/api/generate-itinerary/:tripId`
- `/api/trip-flights/:tripId`
- `/api/reset-password/:token`

- Frontend components:
- FlightResultsDisplay.jsx
- IteneraryDisplay.jsx
- TripDetailsModal.jsx
- Settings.jsx
- ItineraryReviewPage.jsx
- ViewFlightsPage.jsx
- CSS styling for flight and trip components
- React routing configuration
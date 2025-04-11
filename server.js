const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const MongoClient = require('mongodb').MongoClient;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors({origin: "http://localhost:5173", credentials: true}));
app.use(express.json());
app.use(cookieParser());

const Mongo_url_key = process.env.MONGO_URL;
const client = new MongoClient(Mongo_url_key);

client.connect()
  .then(() => {
    console.log('Connected to MongoDB');

    const db = client.db();

    const authRoutes = require('./routes/authRoutes')(client);
    const tripRoutes = require('./routes/tripRoutes')(client, genAI);
    const flightRoutes = require('./routes/flightRoutes')(client);
    
    app.use('/api/auth', authRoutes);
    app.use('/api/trips', tripRoutes);
    app.use('/api', flightRoutes);
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
  });
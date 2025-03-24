const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const MongoClient= require('mongodb').MongoClient;
const Mongo_url_key= process.env.MONGO_URL;
const client = new MongoClient(Mongo_url_key);

app.post('/api/login', async(req, res)=>{
    const {username, password} = req.body;
    if (!username || !password){
        return res.status(400).json({error: 'username and password required!'})
    }

    const db = client.db();
    const user = await db.collection('users').findOne({username: username});
    
    if (!user){
        return res.status(400).json({error: 'user not found!'});
    }
    if (user.password != password){
        return res.status(400).json({error: 'passwords do not match'});
    }

    res.status(200).json({
        message: 'Login successful',
        userId: user._id,
        username:user.username,

    });

  });

app.post('/api/signup', async(req,res)=>{
    const {username, password, email}=req.body;

    if(!username || !password || !email){
        return res.status(400).json({error: 'username, password, and email are required!'});  
    }

    const db = client.db();
    const existuser = await db.collection('users').findOne({email: email});

    if(existuser){
        return res.status(400).json({error: 'User already exists!'});
    }

    try{
        const newUser = {
            username: username,
            password: password,
            email: email,
        }
        const user = await db.collection('users').insertOne(newUser);

        res.status(200).json({
            message: 'signup successful',
            id: user.insertedId
        });
    }catch (error){
        console.error(error);
        res.status(500).json({error: 'error creating user'})
    };
  });





  client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    
    app.listen(5000, () => {
      console.log('Server running on http://localhost:5000');
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
  });
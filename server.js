const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const {authenticateMiddleware} = require('./middleware/middleware')
const { generateTokenAndSetCookie } = require('./generateTokenAndSetCookie');
const { sendVerificationEmail } = require('./mailtrap/emails');
const { sendPasswordResetEmail } = require('./mailtrap/emails');


dotenv.config();

const app = express();


app.use(cors({origin: "http://localhost:5173", credentials: true}));
app.use(express.json());
app.use(cookieParser());

const MongoClient= require('mongodb').MongoClient;
const Mongo_url_key= process.env.MONGO_URL;
const client = new MongoClient(Mongo_url_key);



app.post('/api/reset-password/:token', async(req, res)=>{
    const {token} = req.params;
    const {password} = req.body;

    try{
        const db = client.db();
        const user = await db.collection('users').findOne({
            resetPasswordToken: token,
            resetPasswordTokenExpiration:{$gt: Date.now()}
    })

    if (!user){
        return res.status(400).json({success:false, message: "invlaid or expired token"})
    }

    await db.collection('users').updateOne(
        { email: user.email },
        {
            $set: { password: password },
            $unset: { resetPasswordToken: "", resetPasswordTokenExpiration: "" }
        }
    );

    return res.status(200).json({ success: true, message: "Password reset successfully" });

    }catch (error) {
        console.error("Error in reset-password:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }


    

})


app.post('/api/forgot-password', async(req, res)=>{
    const {email} = req.body;
    try{
        const db = client.db();
        const user = await db.collection('users').findOne({
            email: email
        })

        if(!user){
            return res.status(400).json({success: false, message:"User not found"});

        }

        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now()+1*60*60*1000;

        await db.collection('users').updateOne(
            { email: email },
            {
                $set: {
                    resetPasswordToken: resetToken,
                    resetPasswordTokenExpiration: resetTokenExpiresAt
                }
            }
        );

        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
        await sendPasswordResetEmail(email, resetLink);

        return res.status(200).json({
            success: true,
            message: "Password reset email sent successfully"
        });


    }catch (error) {
        console.error('Error during forgot-password request:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
})


app.post('/api/verify-email', async (req, res) => {
    const { code } = req.body;

    try {
        const db = client.db();
        const user = await db.collection('users').findOne({
            emailVerificationCode: code,
            emailVerificationCodeExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification code." });
        }


        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { isVerified: true, emailVerificationCode: undefined, emailVerificationCodeExpires: undefined } }
        );

        res.status(200).json({ message: 'Email successfully verified.' });

    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.get('/api/home', authenticateMiddleware,(req, res)=>{
    res.json({
        message:'welcome this page is protected',
        user: req.user
    })
})

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
        return res.status(401).json({error: 'passwords do not match'});
    }
    if (!user.isVerified) {
        return res.status(403).json({ error: 'Please verify your email to log in.' });
    }

    generateTokenAndSetCookie(res, user._id);

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
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = Date.now() + 24 * 60 * 60 * 1000;


    try{
        const newUser = {
            username: username,
            password: password,
            email: email,
            isVerified: false,
            emailVerificationCode: verificationCode,
            emailVerificationCodeExpires: expirationTime,
            resetPasswordToken:null,
            resetPasswordTokenExpiration: null,
        }
        const user = await db.collection('users').insertOne(newUser);

        await sendVerificationEmail(email, verificationCode)
        res.status(200).json({
            message: 'signup successful',
            id: user.insertedId,
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
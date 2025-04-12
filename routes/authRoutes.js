const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs'); // Added bcrypt for password hashing
const { OAuth2Client } = require('google-auth-library');
const { ObjectId } = require('mongodb');
const { generateTokenAndSetCookie } = require('../generateTokenAndSetCookie');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../sendgrid/emails');
const { authenticateMiddleware } = require('../middleware/middleware');

module.exports = function (client) {
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    router.post('/google-login', async (req, res) => {
        const { credential } = req.body;
        
        if (!credential) {
            return res.status(400).json({ error: 'Google token is required' });
        }

        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            
            const payload = ticket.getPayload();
            const googleId = payload.sub;
            const email = payload.email;
            const name = payload.name;
            
            const db = client.db();
            let user = await db.collection('users').findOne({ googleId });
            
            if (!user) {
                user = await db.collection('users').findOne({ email });
                
                if (user) {
                    await db.collection('users').updateOne(
                        { _id: user._id },
                        { $set: { googleId, isVerified: true } }
                    );
                } else {
                    const newUser = {
                        googleId,
                        username: name,
                        email,
                        isVerified: true,
                        emailVerificationCode: null,
                        emailVerificationCodeExpires: null,
                        resetPasswordToken: null,
                        resetPasswordTokenExpiration: null,
                        createdAt: new Date(),
                    };
                    
                    const result = await db.collection('users').insertOne(newUser);
                    user = { ...newUser, _id: result.insertedId };
                }
            }
            
            generateTokenAndSetCookie(res, user._id);
            
            return res.status(200).json({
                message: 'Google login successful',
                userId: user._id,
                username: user.username,
            });
            
        } catch (error) {
            console.error('Google authentication error:', error);
            return res.status(401).json({ error: 'Invalid Google token' });
        }
    });

    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'username and password required!' });
        
        const db = client.db();
        const user = await db.collection('users').findOne({ username: username });
        if (!user) return res.status(400).json({ error: 'user not found!' });

        // Use bcrypt to compare hashed password
        const isMatch = user.password ? await bcrypt.compare(password, user.password) : false;
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        if (!user.isVerified) return res.status(403).json({ error: 'Please verify your email to log in.' });

        generateTokenAndSetCookie(res, user._id);
        res.status(200).json({ message: 'Login successful', userId: user._id, username: user.username });
    });

    router.post('/signup', async (req, res) => {
        const { username, password, email } = req.body;
        if (!username || !password || !email) return res.status(400).json({ error: 'username, password, and email are required!' });
        
        // Validate password strength
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                error: 'Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.' 
            });
        }

        const db = client.db();
        const existuser = await db.collection('users').findOne({ $or: [{ email: email }, { username: username }] });
        if (existuser) return res.status(400).json({ error: 'Email or Username already exists!' });

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expirationTime = Date.now() + 15 * 60 * 1000;

        try {
            // Hash password before storing
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = {
                username: username,
                password: hashedPassword, // Store hashed password
                email: email,
                isVerified: false,
                emailVerificationCode: verificationCode,
                emailVerificationCodeExpires: expirationTime,
                resetPasswordToken: null,
                resetPasswordTokenExpiration: null,
                createdAt: new Date(),
            }
            const user = await db.collection('users').insertOne(newUser);
            await sendVerificationEmail(email, verificationCode);
            res.status(201).json({ message: 'Signup successful! Please check your email for verification code.', id: user.insertedId });
        } catch (error) {
            console.error("Signup Error:", error);
            res.status(500).json({ error: 'Error creating user' });
        }
    });

    router.post('/verify-email', async (req, res) => {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: "Verification code is required." });

        try {
            const db = client.db();
            const user = await db.collection('users').findOne({
                emailVerificationCode: code,
                emailVerificationCodeExpires: { $gt: Date.now() }
            });

            if (!user) return res.status(400).json({ message: "Invalid or expired verification code." });

            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { isVerified: true }, $unset: { emailVerificationCode: "", emailVerificationCodeExpires: "" } }
            );
            res.status(200).json({ message: 'Email successfully verified.' });
        } catch (error) {
            console.error('Error verifying email:', error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    });

    router.post('/forgot-password', async (req, res) => {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });
        try {
            const db = client.db();
            const user = await db.collection('users').findOne({ email: email });
            if (!user) {
                return res.status(200).json({ success: true, message: "If an account with that email exists, a password reset link has been sent." });
            }

            const resetToken = crypto.randomBytes(32).toString("hex");
            const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { resetPasswordToken: resetToken, resetPasswordTokenExpiration: resetTokenExpiresAt } }
            );

            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
            await sendPasswordResetEmail(email, resetLink);

            return res.status(200).json({ success: true, message: "If an account with that email exists, a password reset link has been sent." });
        } catch (error) {
            console.error('Error during forgot-password request:', error);
            return res.status(500).json({ success: false, message: 'Internal server error during password reset request.' });
        }
    });

    router.post('/reset-password/:token', async (req, res) => {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (!password || !confirmPassword) {
            return res.status(400).json({ success: false, message: "New password and confirmation are required." });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.' 
            });
        }

        try {
            const db = client.db();
            const user = await db.collection('users').findOne({
                resetPasswordToken: token,
                resetPasswordTokenExpiration: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({ success: false, message: "Password reset token is invalid or has expired." });
            }

            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await db.collection('users').updateOne(
                { _id: user._id },
                {
                    $set: { password: hashedPassword },
                    $unset: { resetPasswordToken: "", resetPasswordTokenExpiration: "" }
                }
            );

            res.clearCookie('token');

            return res.status(200).json({ success: true, message: "Password has been reset successfully. Please log in." });

        } catch (error) {
            console.error('Error resetting password:', error);
            return res.status(500).json({ success: false, message: 'Internal server error during password reset.' });
        }
    });

    router.get('/profile', authenticateMiddleware, async (req, res) => {
        try {
            const db = client.db();
            const userId = req.user.userId;

            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({ success: false, message: "Invalid user ID format in token" });
            }

            const user = await db.collection('users').findOne(
                { _id: new ObjectId(userId) },
                { projection: { password: 0, emailVerificationCode: 0, emailVerificationCodeExpires: 0, resetPasswordToken: 0, resetPasswordTokenExpiration: 0 } }
            );

            if (!user) return res.status(404).json({ success: false, message: "User not found" });
            return res.json({ success: true, user });
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return res.status(500).json({ success: false, message: "Failed to retrieve profile" });
        }
    });

    router.post('/logout', (req, res) => {
        try {
            res.clearCookie('token', {
                 httpOnly: true,
                 secure: process.env.NODE_ENV === "production",
                 sameSite: "strict",
            });
            return res.json({ success: true, message: "Logged out successfully" });
        } catch (error) {
             console.error("Logout Error:", error);
             return res.status(500).json({ success: false, message: "Logout failed" });
        }
    });

    router.delete('/delete-account', authenticateMiddleware, async (req, res) => {
        try {
            const userId = req.user.userId;
            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({ success: false, message: "Invalid user ID format in token" });
            }
            const db = client.db();

            await db.collection('trips').deleteMany({ userId: userId });
            const result = await db.collection('users').deleteOne({ _id: new ObjectId(userId) });

            if (result.deletedCount === 0) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
            });

            return res.json({ success: true, message: "Account deleted successfully" });
        } catch (error) {
            console.error("Error deleting account:", error);
            return res.status(500).json({ success: false, message: "Failed to delete account" });
        }
    });

    return router;
};
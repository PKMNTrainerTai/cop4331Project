const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { generateTokenAndSetCookie } = require('../generateTokenAndSetCookie');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../sendgrid/emails');
const { authenticateMiddleware } = require('../middleware/middleware');

// Initialize routes with db client from server.js
module.exports = function (client) {

    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'username and password required!' });
        }

        const db = client.db();
        const user = await db.collection('users').findOne({ username: username });

        if (!user) {
            return res.status(400).json({ error: 'user not found!' });
        }
        if (user.password != password) {
            return res.status(401).json({ error: 'passwords do not match' });
        }
        if (!user.isVerified) {
            return res.status(403).json({ error: 'Please verify your email to log in.' });
        }

        generateTokenAndSetCookie(res, user._id);

        res.status(200).json({
            message: 'Login successful',
            userId: user._id,
            username: user.username,
        });
    });

    // User signup
    router.post('/signup', async (req, res) => {
        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ error: 'username, password, and email are required!' });
        }

        const db = client.db();
        const existuser = await db.collection('users').findOne({ email: email });

        if (existuser) {
            return res.status(400).json({ error: 'User already exists!' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expirationTime = Date.now() + 24 * 60 * 60 * 1000;

        try {
            const newUser = {
                username: username,
                password: password,
                email: email,
                isVerified: false,
                emailVerificationCode: verificationCode,
                emailVerificationCodeExpires: expirationTime,
                resetPasswordToken: null,
                resetPasswordTokenExpiration: null,
            }
            const user = await db.collection('users').insertOne(newUser);

            await sendVerificationEmail(email, verificationCode)
            res.status(200).json({
                message: 'signup successful',
                id: user.insertedId,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'error creating user' });
        }
    });

    // Verify email
    router.post('/verify-email', async (req, res) => {
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

    // Forgot password
    router.post('/forgot-password', async (req, res) => {
        const { email } = req.body;
        try {
            const db = client.db();
            const user = await db.collection('users').findOne({
                email: email
            });

            if (!user) {
                return res.status(400).json({ success: false, message: "User not found" });
            }

            const resetToken = crypto.randomBytes(20).toString("hex");
            const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

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
        } catch (error) {
            console.error('Error during forgot-password request:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });

    router.get('/profile', authenticateMiddleware, async (req, res) => {
        try {

            const db = client.db();
            const userId = req.user.userId;

            const user = await db.collection('users').findOne(
                { _id: new ObjectId(userId) },
                { projection: { password: 0, resetPasswordToken: 0, resetPasswordTokenExpiration: 0 } }
            );

            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            return res.json({
                success: true,
                user
            });
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve profile"
            });
        }
    });

    // Logout user
    router.post('/logout', (req, res) => {
        res.clearCookie('token');
        return res.json({
            success: true,
            message: "Logged out successfully"
        });
    });

    // Delete account
    router.delete('/delete-account', authenticateMiddleware, async (req, res) => {
        try {
            const userId = req.user.userId;

            // First delete all user's trips
            await db.collection('trips').deleteMany({ userId: userId });

            // Then delete the user
            const result = await db.collection('users').deleteOne({
                _id: new ObjectId(userId)
            });

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Clear authentication token
            res.clearCookie('token');

            return res.json({
                success: true,
                message: "Account deleted successfully"
            });
        } catch (error) {
            console.error("Error deleting account:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to delete account"
            });
        }
    });

    return router;
};
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { generateTokenAndSetCookie } = require('../generateTokenAndSetCookie'); // Assuming this file exists and is correct
const { sendVerificationEmail, sendPasswordResetEmail } = require('../sendgrid/emails'); // Assuming these exist
const { authenticateMiddleware } = require('../middleware/middleware'); // Assuming this exists

// Initialize routes with db client from server.js
module.exports = function (client) {

    // --- Login ---
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'username and password required!' });
        const db = client.db();
        const user = await db.collection('users').findOne({ username: username });
        if (!user) return res.status(400).json({ error: 'user not found!' });

        // *** SECURITY WARNING: Storing and comparing plain text passwords is very insecure! ***
        // *** Use password hashing (e.g., bcrypt) in a real application. ***
        if (user.password !== password) { // Direct comparison (INSECURE)
             return res.status(401).json({ error: 'Incorrect password' }); // Changed message slightly
        }
        // *** End Security Warning ***

        if (!user.isVerified) return res.status(403).json({ error: 'Please verify your email to log in.' });

        generateTokenAndSetCookie(res, user._id); // Generate JWT and set cookie
        res.status(200).json({ message: 'Login successful', userId: user._id, username: user.username });
    });

    // --- Signup ---
    router.post('/signup', async (req, res) => {
        const { username, password, email } = req.body;
        if (!username || !password || !email) return res.status(400).json({ error: 'username, password, and email are required!' });
        const db = client.db();
        const existuser = await db.collection('users').findOne({ $or: [{ email: email }, { username: username }] }); // Check username too
        if (existuser) return res.status(400).json({ error: 'Email or Username already exists!' });

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expirationTime = Date.now() + 15 * 60 * 1000; // Set expiry (e.g., 15 minutes)

        try {
            const newUser = {
                username: username,
                // *** SECURITY WARNING: Storing plain text password! Hash this in production. ***
                password: password,
                // *** End Security Warning ***
                email: email,
                isVerified: false,
                emailVerificationCode: verificationCode,
                emailVerificationCodeExpires: expirationTime,
                resetPasswordToken: null,
                resetPasswordTokenExpiration: null,
                createdAt: new Date(),
            }
            const user = await db.collection('users').insertOne(newUser);
            await sendVerificationEmail(email, verificationCode); // Send email
            res.status(201).json({ message: 'Signup successful! Please check your email for verification code.', id: user.insertedId }); // Status 201 for created
        } catch (error) {
            console.error("Signup Error:", error);
            res.status(500).json({ error: 'Error creating user' });
        }
    });

    // --- Verify Email ---
    router.post('/verify-email', async (req, res) => {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: "Verification code is required." });

        try {
            const db = client.db();
            // Find user by code AND ensure it hasn't expired
            const user = await db.collection('users').findOne({
                emailVerificationCode: code,
                emailVerificationCodeExpires: { $gt: Date.now() } // Check expiry
            });

            if (!user) return res.status(400).json({ message: "Invalid or expired verification code." });

            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { isVerified: true }, $unset: { emailVerificationCode: "", emailVerificationCodeExpires: "" } } // Clear code/expiry
            );
            res.status(200).json({ message: 'Email successfully verified.' });
        } catch (error) {
            console.error('Error verifying email:', error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    });

    // --- Forgot Password ---
    router.post('/forgot-password', async (req, res) => {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });
        try {
            const db = client.db();
            const user = await db.collection('users').findOne({ email: email });
            // IMPORTANT: Even if user not found, send success to prevent email enumeration
            if (!user) {
                console.warn(`Password reset attempt for non-existent email: ${email}`);
                return res.status(200).json({ success: true, message: "If an account with that email exists, a password reset link has been sent." });
            }

            const resetToken = crypto.randomBytes(32).toString("hex"); // Longer token
            const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour expiry

            await db.collection('users').updateOne(
                { _id: user._id }, // Use ID for update safety
                { $set: { resetPasswordToken: resetToken, resetPasswordTokenExpiration: resetTokenExpiresAt } }
            );

            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`; // Use env var for frontend URL
            await sendPasswordResetEmail(email, resetLink); // Send email with link

            return res.status(200).json({ success: true, message: "If an account with that email exists, a password reset link has been sent." });
        } catch (error) {
            console.error('Error during forgot-password request:', error);
            return res.status(500).json({ success: false, message: 'Internal server error during password reset request.' });
        }
    });

    // *** NEW: POST /api/auth/reset-password/:token - Handle the actual password reset ***
    router.post('/reset-password/:token', async (req, res) => {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (!password || !confirmPassword) {
            return res.status(400).json({ success: false, message: "New password and confirmation are required." });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }
        // Add password complexity checks here if desired

        try {
            const db = client.db();

            // Find user by valid, non-expired token
            const user = await db.collection('users').findOne({
                resetPasswordToken: token,
                resetPasswordTokenExpiration: { $gt: Date.now() } // Check expiry
            });

            if (!user) {
                return res.status(400).json({ success: false, message: "Password reset token is invalid or has expired." });
            }

            // *** SECURITY WARNING: Storing plain text password! Hash this in production. ***
            const newPassword = password; // In real app: const hashedPassword = await bcrypt.hash(password, 10);
            // *** End Security Warning ***

            // Update the password and clear reset token fields
            await db.collection('users').updateOne(
                { _id: user._id },
                {
                    $set: { password: newPassword }, // Store new (hashed) password
                    $unset: { resetPasswordToken: "", resetPasswordTokenExpiration: "" } // Clear token fields
                }
            );

            // Optionally send a password change confirmation email here

            res.clearCookie('token'); // Clear any existing session cookie

            return res.status(200).json({ success: true, message: "Password has been reset successfully. Please log in." });

        } catch (error) {
            console.error('Error resetting password:', error);
            return res.status(500).json({ success: false, message: 'Internal server error during password reset.' });
        }
    });


    // --- Get Profile ---
    router.get('/profile', authenticateMiddleware, async (req, res) => {
        try {
            const db = client.db();
            const userId = req.user.userId; // From authenticateMiddleware

            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({ success: false, message: "Invalid user ID format in token" });
            }

            const user = await db.collection('users').findOne(
                { _id: new ObjectId(userId) },
                // Projection to exclude sensitive fields
                { projection: { password: 0, emailVerificationCode: 0, emailVerificationCodeExpires: 0, resetPasswordToken: 0, resetPasswordTokenExpiration: 0 } }
            );

            if (!user) return res.status(404).json({ success: false, message: "User not found" });
            return res.json({ success: true, user });
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return res.status(500).json({ success: false, message: "Failed to retrieve profile" });
        }
    });

    // --- Logout ---
    router.post('/logout', (req, res) => {
        try {
            res.clearCookie('token', {
                 httpOnly: true,
                 secure: process.env.NODE_ENV === "production",
                 sameSite: "strict",
            }); // Clear the cookie
            return res.json({ success: true, message: "Logged out successfully" });
        } catch (error) {
             console.error("Logout Error:", error);
             return res.status(500).json({ success: false, message: "Logout failed" });
        }
    });

    // --- Delete Account ---
    router.delete('/delete-account', authenticateMiddleware, async (req, res) => {
        try {
            const userId = req.user.userId;
             if (!ObjectId.isValid(userId)) {
                 return res.status(400).json({ success: false, message: "Invalid user ID format in token" });
             }
            const db = client.db();

            // First delete all user's trips (or handle differently based on requirements)
            console.log(`Deleting trips for user: ${userId}`);
            await db.collection('trips').deleteMany({ userId: userId }); // Ensure trips have userId field stored correctly
            console.log(`Trips deleted. Deleting user: ${userId}`);

            // Then delete the user
            const result = await db.collection('users').deleteOne({ _id: new ObjectId(userId) });

            if (result.deletedCount === 0) {
                // This might happen if the user was already deleted or ID was wrong
                return res.status(404).json({ success: false, message: "User not found" });
            }

            // Clear authentication token cookie
             res.clearCookie('token', {
                 httpOnly: true,
                 secure: process.env.NODE_ENV === "production",
                 sameSite: "strict",
            });

            console.log(`User ${userId} deleted successfully.`);
            return res.json({ success: true, message: "Account deleted successfully" });
        } catch (error) {
            console.error("Error deleting account:", error);
            return res.status(500).json({ success: false, message: "Failed to delete account" });
        }
    });

    return router;
};
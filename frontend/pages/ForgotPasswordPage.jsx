import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/AuthPages.css';

function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        if (!email) {
            setError('Please enter your email address.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            // Check status code first to handle error, even if backend always returns success
            if (!response.ok) {
                // This might indicate a server error rather than user not found
                throw new Error(data.message || `Server error: ${response.status}`);
            }

            // Use the consistent success message from the backend
            setSuccessMessage(data.message || 'If an account exists, an email has been sent.');


        } catch (err) {
            console.error('Forgot password request failed:', err);
            // Show a generic error, specific errors can reveal if an email is registered
            setError('An error occurred. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container ">
            <button onClick={() => navigate(-1)} className="btn btn-back">←</button>
            <div className="auth-form-container">
                <h2>Forgot Password</h2>
                <p>Enter the email address associated with your account, and we'll send you a link to reset your password.</p>

                <form onSubmit={handleSubmit}>
                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
                <div className="auth-links">
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;
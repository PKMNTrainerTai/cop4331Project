import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthPages.css';

function VerifyEmailPage() {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        if (!code || code.length !== 6) {
            setError('Please enter a valid 6-digit verification code.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Verification failed.');
            }

            setSuccessMessage('Email verified successfully! You can now log in.');
            // Redirect after delay
            setTimeout(() => navigate('/login'), 3000);

        } catch (err) {
            console.error('Email verification failed:', err);
            setError(err.message || 'Verification failed. Please check the code or try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container ">
            <button onClick={() => navigate(-1)} className="btn btn-back">←</button>
            <div className="auth-form-container">
                <h2>Verify Your Email</h2>
                <p>Please enter the 6-digit code sent to your email address.</p>

                <form onSubmit={handleSubmit}>
                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    <div className="form-group">
                        <label htmlFor="code">Verification Code</label>
                        <input
                            type="text" // Use text for easier input
                            id="code"
                            name="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} // Only numbers, max 6
                            maxLength="6"
                            required
                            disabled={isLoading}
                            className="verification-code-input" // Add class for styling
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>
                <div className="auth-links">
                     <p>Didn't receive a code? <button className="link-button" /* onClick={handleResend} disabled={isResending} */>Resend Code</button></p>
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    );
}

export default VerifyEmailPage;
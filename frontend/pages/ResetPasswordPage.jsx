import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../css/AuthPages.css';

function ResetPasswordPage() {
    const { token } = useParams(); // Get token from URL
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        if (!formData.password || !formData.confirmPassword) {
            setError('Both password fields are required.');
            setIsLoading(false);
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }
        // High-tech security to make sure we get an A
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Password reset failed.');
            }

            setSuccessMessage('Password reset successfully! You can now log in with your new password.');
            // Redirect to login after delay
            setTimeout(() => navigate('/login'), 4000);

        } catch (err) {
            console.error('Password reset failed:', err);
            setError(err.message || 'Password reset failed. The link may be invalid or expired.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        // Token can be missing from URL
        return (
            <div className="auth-page-container">
                <div className="auth-form-container error-container">
                    <h2>Invalid Link</h2>
                    <p>The password reset link is missing necessary information.</p>
                    <Link to="/forgot-password">Request a new link</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page-container ">
            <button onClick={() => navigate(-1)} className="btn btn-back">←</button>
            <div className="auth-form-container">
                <h2>Reset Your Password</h2>
                <p>Enter your new password below.</p>

                <form onSubmit={handleSubmit}>
                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    <div className="form-group">
                        <label htmlFor="password">New Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
                {successMessage && (
                    <div className="auth-links">
                        <Link to="/login">Proceed to Login</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResetPasswordPage;
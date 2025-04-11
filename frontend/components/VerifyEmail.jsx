import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:5000/api/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                navigate('/login');
            } else {
                setError(data.message || 'Invalid or expired code');
            }
        } catch (error) {
            console.error('Error verifying email:', error);
            setError('Something went wrong.');
        }
    };

    return (
        <div className="verify-email-wrapper">
            <h2>Verify Your Email</h2>
            <p>Please enter the verification code sent to your email.</p>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter verification code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                />
                <button type="submit">Verify</button>
            </form>

            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default VerifyEmail;
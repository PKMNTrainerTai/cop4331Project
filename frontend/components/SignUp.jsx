import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/SignUp.css';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  // Password validation states
  const [validations, setValidations] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
    match: false
  });

  useEffect(() => {
    // Check password requirements whenever the password changes
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;
    
    setValidations({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
      match: password === confirmPassword && password !== ''
    });
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccessMessage('');
  };

  const handleFocus = (field) => {
    if (field === 'password') {
      setIsPasswordFocused(true);
    }
  };

  const handleBlur = (field) => {
    if (field === 'password') {
      // Keep requirements visible if there's text in the password field
      if (!formData.password) {
        setIsPasswordFocused(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    // Validate all required fields
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required.');
      setIsLoading(false);
      return;
    }

    // Check if all password requirements are met
    if (!validations.length || !validations.uppercase || !validations.number || !validations.special) {
      setError('Please ensure your password meets all the requirements.');
      setIsLoading(false);
      return;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      console.log('Signup successful:', data);
      setSuccessMessage('Signup successful! Please check your email to verify your account.');
      navigate('/verify-email');

    } catch (err) {
      console.error('Signup failed:', err);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page-container">
      <div className="signup-form-container">
        <h2>Create Account</h2>
        <p>Join Travelite!</p>

        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              required 
              disabled={isLoading} 
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              disabled={isLoading} 
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange}
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
              required 
              disabled={isLoading} 
            />
            
            {/* Password requirements checklist - only visible when password field is focused or has content */}
            {(isPasswordFocused || formData.password) && (
              <div className="password-requirements">
                <p>Password requirements:</p>
                <ul>
                  <li className={validations.length ? "valid" : "invalid"}>
                    {validations.length ? "✓" : "○"} At least 8 characters
                  </li>
                  <li className={validations.uppercase ? "valid" : "invalid"}>
                    {validations.uppercase ? "✓" : "○"} At least one uppercase letter
                  </li>
                  <li className={validations.number ? "valid" : "invalid"}>
                    {validations.number ? "✓" : "○"} At least one number
                  </li>
                  <li className={validations.special ? "valid" : "invalid"}>
                    {validations.special ? "✓" : "○"} At least one special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              name="confirmPassword" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              required 
              disabled={isLoading} 
            />
            {formData.confirmPassword && (
              <div className={`password-match ${validations.match ? "valid" : "invalid"}`}>
                {validations.match ? "✓ Passwords match" : "× Passwords do not match"}
              </div>
            )}
          </div>
          <button 
            type="submit" 
            className="btn btn-primary signup-button" 
            disabled={isLoading || !validations.length || !validations.uppercase || !validations.number || !validations.special || !validations.match}
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="signup-links">
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
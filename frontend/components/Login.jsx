import React, { useState } from 'react';
import {useNavigate} from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {jwtDecode} from "jwt-decode";
import './Login.css';
import { FaLock } from "react-icons/fa";
import { FaUserAlt } from "react-icons/fa";



const Login = ({onSubmit}) => {
    const [username,setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleUsernameChange = (e) =>{
        setUsername(e.target.value);
    }
    const handlePasswordChange =(e)=>{
        setPassword(e.target.value);
    }
    const handleForgotPasswordClick = () => {
        navigate('/forgot-password');
    };

    const handleSignUpClick = () => {
        navigate('/signup'); 
    };
    
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        console.log('Username:', username);  // Ensure this logs correctly
        console.log('Password:', password);

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include', // Ensure cookies are included in the request
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    setMessage("Username/Password combination incorrect");
                } else if (response.status === 403) {
                    setMessage("Please verify your email to log in");
                } else {
                    setMessage(data.error || 'Login failed!');
                }
            } else {
                // If login is successful
                if (onSubmit) onSubmit(data);
                setTimeout(() => navigate('/home'), 100);
            }
        } catch (error) {
            setMessage('An error occurred during login');
            console.error('Error:', error);
        }
    };

  return (
    <div className='login-wrapper'>
        <form onSubmit={handleFormSubmit}>

            <h1>Login</h1>

            <div className = "login-input-box">
                <input type="text" placeholder='Username' value={username} onChange={handleUsernameChange} required />
                <FaUserAlt className='icon' />
            </div>

            <div className='login-input-box'>
                <input type="password" placeholder='Password' value={password} onChange={handlePasswordChange} required />
                <FaLock className='icon'/>
            </div>

            <div className='remember-forgot'>
                <label><input type="checkbox" />Remember me</label>
                <a href="" onClick={handleForgotPasswordClick}>Forgot password?</a>
            </div>

            <div>
                <button type="submit">Login</button>
            </div>

            <GoogleLogin
                    onSuccess={(credentialResponse) => {
                        console.log("Google OAuth Success:", credentialResponse);
                        console.log(jwtDecode(credentialResponse.credential))
                        navigate('/home'); // Navigate after successful login
                    }}
                    onError={() => console.log("Login Failed")}
                />

            <div className="register-link">
                <p>Don't have an account? <a href="#" onClick={handleSignUpClick}>Register</a></p>
            </div>

            {message && <p className="error">{message}</p>}

        </form>

    </div>
  );
}
export default Login;
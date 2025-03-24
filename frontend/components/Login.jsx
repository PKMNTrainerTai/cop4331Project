import React, { useState } from 'react';
import {useNavigate} from 'react-router-dom';
import { account } from '../src/appwrite';
import './Login.css';
import { FaLock } from "react-icons/fa";
import { FaUserAlt } from "react-icons/fa";



const Login = ({onSubmit}) => {
    const [username,setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleUsernameChange = (e) =>{
        setUsername(e.target.value);
    }
    const handlePasswordChange =(e)=>{
        setPassword(e.target.value);
    }
    
    const handleFormSubmit = async (e) => {
        e.preventDefault();
    
        try {
          const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });
    
          const data = await response.json();
    
          if (response.ok) {
            
            console.log('Login successful', data);
            onSubmit(data);
            navigate('/home');
            
          } else {
            
            setError(data.error || 'Login failed!');
            console.log('Login failed', data);
          }
        } catch (error) {
          setError('An error occurred');
          console.error('Error:', error);
        }
     }

     const handleOAuthLogin = (provider) => {
        account.createOAuth2Session(
          provider, 
          'http://localhost:5173/home', // Redirect URL on success (frontend port)
          'http://localhost:5173/login' // Redirect URL on failure (frontend port)
        ).then(() => {
          navigate('/home'); // Navigate to home after successful OAuth login
        }).catch((error) => {
          console.error("OAuth login failed", error);
        });

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
                <a href="">Forgot password?</a>
            </div>

            <div>
                <button type="submit">Login</button>
            </div>

            <div>
                <button type="button" onClick={() => handleOAuthLogin('google')}>Login with Google</button>
            </div>

            <div className="register-link">
                <p>Don't have an account? <a href="#">Register</a></p>
            </div>

        </form>

    </div>
  );
}
export default Login;
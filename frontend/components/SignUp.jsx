import React, { useState } from 'react';
import './SignUp.css'

const SignUp = ({onSubmit}) => {
    const [username,setUsername]= useState('');
    const [password, setPassword]= useState('');
    const [email, setEmail]= useState('');
    const [error, setError]= useState('');
    const [loading, setLoading] = useState(false);

    const handleUsernameChange =(e)=>{
        setUsername(e.target.value);

    }
    const handlePasswordChange =(e)=>{
        setPassword(e.target.value)
    }
    const handleEmailChange=(e)=>{
        setEmail(e.target.value);
    }
    const handleFormChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
    
        try {
            const response = await fetch('http://localhost:5000/api/signup', {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                    email,
                }),
            });
    
            const data = await response.json(); 
            
            if (response.ok) {
                alert('Signup successful');
                onSubmit(data); 
            } else {
                setError(data.error || 'Something went terribly wrong!');
            }
        } catch (error) {
            setError('Error connecting to server');
            console.error('Error during signup:', error);
        }
        setLoading(false);
    };
    return(
        <div className="wrapper">
            <form onSubmit={handleFormChange}>
                <h1>Sign Up</h1>
                <div className="input-box">
                    <input type='text' placeholder='Username' value={username} onChange={handleUsernameChange} required/>
                </div>
                <div className="input-box">
                    <input type='password' placeholder='Password' value={password} onChange={handlePasswordChange} required/>
                </div>
                <div className="input-box">
                    <input type='email' placeholder='Email' value={email} onChange={handleEmailChange} required/>
                </div>

                <button type='submit'>Sign Up</button>

                <div className="existaccount"><p>Already have an account?<a href='#'>Sign In</a></p></div>
            </form>
        </div>

    );
}
export default SignUp;
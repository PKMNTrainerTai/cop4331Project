import React from 'react';
import Login from '../components/Login';

const LoginPage = () => {
    
    const handleLogin = (username,password) =>{
        console.log("User tried to log in with username:", username);
        console.log("Password:", password);  // Be mindful about logging passwords in a real-world app
    }

    return(
     <div>
        <Login onSubmit={handleLogin}/>
     </div>   
    )
}
export default LoginPage;
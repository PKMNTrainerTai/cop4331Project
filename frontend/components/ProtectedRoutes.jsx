import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoutes = ({ children }) => {
    const token = localStorage.getItem('token') // Get the token from localStorage
    console.log('Token from localStorage:', token);
    
    
    if (!token) {
        // Redirect to login if no token found
        return <Navigate to="/login" />;
    }

    return children; // If token exists, render the protected route
};

export default ProtectedRoutes;
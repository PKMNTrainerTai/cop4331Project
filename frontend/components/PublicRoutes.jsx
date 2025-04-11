import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/profile', { credentials: 'include' });
        if (isMounted) setIsAuthenticated(response.ok);
      } catch (error) {
        if (isMounted) setIsAuthenticated(false);
      }
    };
    checkAuth();
    return () => { isMounted = false; };
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  // Redirect to home if authenticated, otherwise show landing page
  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
};

export default PublicRoutes;
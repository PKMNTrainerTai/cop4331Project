import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // True: auth, False: not auth
  const [userData, setUserData] = useState(null); // Store the full user
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      console.log("ProtectedRoutes: Checking authentication..."); // Log
      try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          credentials: 'include', // Again needed for cookie
        });

        if (isMounted) {
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              console.log("ProtectedRoutes: Authentication successful.", data.user); // Log success
              setIsAuthenticated(true);
              setUserData(data.user); // Store user data from the backend
            } else {
              // Call worked, backend said no (e.g., user deleted but token exists?)
              console.warn("ProtectedRoutes: Auth check API ok, but no user data returned.", data);
              setIsAuthenticated(false);
              setUserData(null);
            }
          } else {
            // Bad response
            console.log(`ProtectedRoutes: Authentication failed. Status: ${response.status}`);
            setIsAuthenticated(false);
            setUserData(null);
          }
        }
      } catch (error) {
        // Network error etc
        console.error('ProtectedRoutes: Auth check network error:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setUserData(null);
        }
      }
    };

    // Reset state when location changes before checking again
    setIsAuthenticated(null);
    setUserData(null);
    checkAuth();

    // Cleanup
    return () => {
      isMounted = false;
      console.log("ProtectedRoutes: Unmounting or location changing.");
    };
    // Using location.pathname might be slightly more stable than location.key sometimes
  }, [location.pathname]);

  // Show loading while checking auth
  if (isAuthenticated === null) {
    // Was going to put a spinner here I promise
    return <div style={{ textAlign: 'center', padding: '5rem', fontSize: '1.2rem' }}>Checking authentication...</div>;
  }

  // Continue if auth, give userData as context
  return isAuthenticated
    ? <Outlet context={userData} />
    : <Navigate to="/login" replace state={{ from: location }} />; // Redirect to login if not authenticated
};

export default ProtectedRoutes;
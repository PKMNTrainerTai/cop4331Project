import React from 'react';
import { Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import Navbar from './Navbar';

function Layout() {
  const navigate = useNavigate();
  const userData = useOutletContext(); // Get user data if needed by Navbar

  // Logout handler function to pass to Navbar
  const handleLogout = async () => {
    console.log("Layout: Logging out...");
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      // Clear theme preference on logout? Meh, good practice
      document.body.classList.remove('dark-mode');
      localStorage.removeItem('theme');
      navigate('/login', { replace: true });
      // Try full reload if state isn't clearing
      // window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
      // Not really sure what could go wrong but no errors left behind
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <> {/* Use Fragment to avoid unnecessary div */}
      {/* Render Navbar */}
      <Navbar handleLogout={handleLogout} />

      <main className="main-content-area">
        {/* Outlet renders route (HomePage, CreateTripPage, etc.) */}
        {/* Pass down the userData if routes need it */}
        <Outlet context={userData} />
      </main>

      {/* The footer that I never coded */}
      {/* <Footer /> */}
    </>
  );
}

export default Layout;
import React, { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// --- Page Imports ---
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import HomePage from '../pages/HomePage';
import CreateTripPage from '../pages/CreateTripPage';
import FindFlightsPage from '../pages/FindFlightsPage';
import ViewFlightsPage from '../pages/ViewFlightsPage';
import ItineraryReviewPage from '../pages/ItineraryReviewPage';
import SettingsPage from '../pages/SettingsPage';

// --- Component Imports ---
import ProtectedRoutes from '../components/ProtectedRoutes';
import PublicRoutes from '../components/PublicRoutes';
import Layout from '../components/Layout';

// --- Style Imports ---
import './App.css';

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    console.log("App Mount: Found saved theme:", savedTheme); // Debug log
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  const Placeholder = ({ title }) => (
    <div className="placeholder-content">
      <h2>{title}</h2>
      <p>This page is under construction.</p>
      <Link to="/home" className="btn btn-secondary btn-sm">Go Home</Link>
      <span style={{ margin: '0 0.5rem' }}>|</span>
      <Link to="/" className="btn btn-secondary btn-sm">Go to Landing</Link>
    </div>
  );

  return (
    // Main container
    <div className="app-container">
      {/* Navbar rendered inside Layout for protected routes */}
      <Routes>
        {/* --- Public Routes (No Layout/Navbar) --- */}
        <Route element={<PublicRoutes />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<SignUpPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>

        {/* --- Protected Routes (Navbar) --- */}
        <Route element={<ProtectedRoutes />}>
          <Route element={<Layout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/create-trip" element={<CreateTripPage />} />
            <Route path="/trip/:tripId/find-flights" element={<FindFlightsPage />} />
            <Route path="/flights/:tripId" element={<ViewFlightsPage />} />
            <Route path="/review-itinerary/:tripId" element={<ItineraryReviewPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* --- Catch-all Route (404 Not Found) --- */}
        <Route path="*" element={<Placeholder title="404 Not Found" />} />
      </Routes>
    </div>
  );
}

export default App;
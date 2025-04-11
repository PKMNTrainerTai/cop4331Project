import React from 'react';
import { Link } from 'react-router-dom';
import '../src/App.css';

function LandingPage() {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1>Welcome to Travelite!</h1>
        <p>Your seamless solution to organize and track your travel itineraries.</p>
      </header>
      <main className="landing-main">
        <p>
          Tired of cluttered travel sites and complex planning tools? We'll help make it simple to plan your next adventure, log your memories, and keep track of everything in one place.
        </p>
        <div className="landing-actions">
          <Link to="/login" className="btn btn-primary">Sign In</Link>
          <Link to="/register" className="btn btn-secondary">Register</Link>
        </div>
      </main>
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} Travelite. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
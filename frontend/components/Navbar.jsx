import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import '../css/Navbar.css';
import logoImage from '../src/assets/logo.png';

// Receives logout handler function
function Navbar({ handleLogout }) {
  return (
    <nav className="global-navbar">
      <div className="navbar-container">
        <Link to="/home" className="navbar-logo">
          <img src={logoImage} alt="Trip Planner Logo" className="navbar-logo-img" />
        </Link>

        {/* Navigation Links */}
        <div className="navbar-links">
          <NavLink to="/home" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}> Home </NavLink>
          <NavLink to="/create-trip" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}> Create Trip </NavLink>
        </div>

        {/* User Actions */}
        <div className="navbar-user-actions">
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link settings-link active' : 'nav-link settings-link'} title="Settings"> Settings </NavLink>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm logout-button-nav" title="Logout"> Logout </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import '../css/HeaderTabs.css';

function HeaderTabs() {
  const [lastTripId, setLastTripId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("lastTripId");
    if (id) setLastTripId(id);
  }, []);

  return (
    <nav className="header-tabs">
      <NavLink to="/profile" className={({ isActive }) => isActive ? 'tab active' : 'tab'}>
        Profile
      </NavLink>
      <NavLink to="/trip-planner" className={({ isActive }) => isActive ? 'tab active' : 'tab'}>
        Trip Generator
      </NavLink>
      <NavLink to="/saved-trips" className={({ isActive }) => isActive ? 'tab active' : 'tab'}>
        Saved Trips
      </NavLink>
    </nav>
  );
}

export default HeaderTabs;

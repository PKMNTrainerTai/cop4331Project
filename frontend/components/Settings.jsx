import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom'; // useOutletContext to get user from ProtectedRoutes
import '../css/Settings.css';

function Settings() {
  const navigate = useNavigate();
  const userData = useOutletContext(); // Get user data passed down
  const userName = userData?.username || 'User'; // Use fetched username

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      // Clear theme on logout might be good UX
      document.body.classList.remove('dark-mode');
      localStorage.removeItem('theme');
      // Login, replace history
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again."); // Not this again
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you SURE you want to delete your account? This is irreversible and will delete all your trips.")) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/delete-account', {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete account');
        }
        alert("Account deleted successfully.");
        document.body.classList.remove('dark-mode');
        localStorage.removeItem('theme');
        navigate('/login', { replace: true });
        // window.location.reload(); // Force state clear
      } catch (error) {
        console.error("Delete account failed:", error);
        alert(`Delete account failed: ${error.message}`);
      }
    }
  }

  return (
    <div className="settings-container">
      <h2>Settings & Account</h2>
      {/* Appearance Section */}
      <section className="settings-section">
        <h3>Appearance</h3>
        <div className="setting-item">
          <label htmlFor="darkModeToggle">Light Mode</label>
          <div className="toggle-switch">
            <input type="checkbox" id="darkModeToggle" checked={theme === 'dark'} onChange={toggleTheme} />
            <label htmlFor="darkModeToggle" className="slider"></label>
          </div>
        </div>
      </section>
      {/* Account Info Section */}
      <section className="settings-section">
        <h3>Account Information</h3>
        <div className="setting-item info-item">
          <span>Username:</span>
          <strong>{userData?.username || 'Loading...'}</strong>
        </div>
        <div className="setting-item info-item">
          <span>Email:</span>
          <strong>{userData?.email || 'Loading...'}</strong>
        </div>
      </section>
      {/* Actions Section */}
      <section className="settings-section account-actions">
        <h3>Account Actions</h3>
        <div className="setting-item"><button onClick={handleLogout} className="btn btn-secondary">Logout</button><p className="action-description">Sign out of your current session.</p></div>
        <div className="setting-item"><button onClick={handleDeleteAccount} className="btn btn-danger">Delete Account</button><p className="action-description">Permanently delete your account and all associated data.</p></div>
      </section>
    </div>
  );
}
export default Settings;
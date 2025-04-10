import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Unable to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        navigate('/login');
      } else {
        setError('Failed to logout. Please try again.');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/delete-account', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        navigate('/signup');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete account. Please try again.');
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Network error. Please try again.');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!user) {
    return <div className="error">Unable to load user profile. Please log in again.</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Your Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-section user-info">
          <h2>Account Information</h2>
          <div className="info-item">
            <span className="info-label">Username:</span>
            <span className="info-value">{user.username}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{user.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Account Created:</span>
            <span className="info-value">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        <div className="profile-section account-actions">
          <h2>Account Management</h2>
          <div className="button-group">
            <button className="logout-button" onClick={handleLogout}>
              Log Out
            </button>
            <button className="delete-button" onClick={() => setShowDeleteModal(true)}>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h2>Delete Account</h2>
            <p>
              Are you sure you want to delete your account? This action cannot be undone.
              All your saved trips and data will be permanently removed.
            </p>
            <div className="modal-buttons">
              <button
                className="cancel-button"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-button"
                onClick={handleDeleteAccount}
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
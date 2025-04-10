import React from 'react';
import Profile from '../components/Profile';
import HeaderTabs from '../components/HeaderTabs'

function ProfilePage() {
  return (
    <div>
        <HeaderTabs/>
      <h1>Profile Page</h1>
      <Profile />
    </div>
  );
}

export default ProfilePage;
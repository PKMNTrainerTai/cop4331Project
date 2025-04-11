import React from 'react';
import { useNavigate } from 'react-router-dom';
import Settings from '../components/Settings';

function SettingsPage() {
  const navigate = useNavigate();
  return (
    <div className="">
      <button onClick={() => navigate('/home')} className="btn btn-back">←</button>
      <Settings />
    </div>
  );
}
export default SettingsPage;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CreateTripForm from '../components/CreateTripForm';

function CreateTripPage() {
  const navigate = useNavigate();
  return (
    <div className="">
      <button onClick={() => navigate(-1)} className="btn btn-back">←</button>
      <CreateTripForm />
    </div>
  );
}

export default CreateTripPage;
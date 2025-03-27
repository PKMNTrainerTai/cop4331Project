import { useState, useEffect } from 'react';

const useProtectedData = () => {
    const [message, setMessage] = useState('');
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        console.log("Token being sent to /api/home:", token); // Debugging log
    
        if (!token) {
            console.log("No token found, skipping request.");
            return;
        }
    
        fetch('/api/home', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,  
            }
        })
        .then(response => {
            console.log("Response status:", response.status); // Debugging log
            if (!response.ok) {
                throw new Error('Failed to fetch protected data');
            }
            return response.json();
        })
        .then(data => {
            console.log("Data received from /api/home:", data); // Debugging log
            setMessage(data.message);
            setUser(data.user);
        })
        .catch(error => {
            console.error("Error fetching protected data:", error);
            setError(error.message);
        });
    }, []);

    return { message, user, error };
};

export default useProtectedData;
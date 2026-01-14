import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PoliticsPrivacity = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data?.path) {
                navigate(event.data.path);
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [navigate]);

    return (
        <iframe
            src="/politic-privacity.html"
            style={{ width: '100%', height: '100vh', border: 'none' }}
            title="SmartPay Landing Page"
        />
    );
};

export default PoliticsPrivacity;

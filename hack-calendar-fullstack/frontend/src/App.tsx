import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes } from 'react-router-dom';
import api from './services/api';

const queryClient = new QueryClient();

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await api.get('/');
        setMessage(response.data);
      } catch (error) {
        console.error('Error fetching API status:', error);
        setMessage('Failed to connect to the API');
      }
    };

    fetchMessage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div>
          <h1>Hack-Calendar</h1>
          <p>API Status: {message}</p>
          <Routes>
            {/* Define your routes here */}
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

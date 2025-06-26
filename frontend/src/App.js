import React, { useState } from 'react';
import TaskGenerator from './components/TaskGenerator';
import Login from './components/Login';
import Register from './components/Register';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <div>
      <h1>Hack Calendar</h1>
      {!isLoggedIn ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <TaskGenerator />
      )}
      <Register />
    </div>
  );
};

export default App;

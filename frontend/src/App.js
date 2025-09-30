import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import MainApp from './MainApp';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({
        token,
        user: { name: 'Пользователь', email: 'user@example.com' }
      });
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {!user ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <MainApp user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
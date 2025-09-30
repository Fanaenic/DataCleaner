import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const API_BASE = 'http://localhost:8000';

const Auth = ({ onLogin }) => {
  const [activeForm, setActiveForm] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const switchForm = (formName) => {
    setActiveForm(formName);
    setMessage('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE}/login/`, {
        email: loginData.email,
        password: loginData.password
      });

      localStorage.setItem('token', response.data.access_token);
      setMessage('✅Вход выполнен успешно!');

      const profileResponse = await axios.get(`${API_BASE}/profile/`, {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`
        }
      });

      setTimeout(() => {
        onLogin({
          token: response.data.access_token,
          user: profileResponse.data
        });
      }, 1000);

    } catch (error) {
      setMessage('Ошибка входа: ' + (error.response?.data?.detail || 'Неверный email или пароль'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (registerData.password !== registerData.confirmPassword) {
      setMessage('Пароли не совпадают!');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setMessage('Пароль должен содержать не менее 6 символов!');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/register/`, {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password
      });

      localStorage.setItem('token', response.data.access_token);
      setMessage('✅Регистрация завершена! Вход выполнен.');

      const profileResponse = await axios.get(`${API_BASE}/profile/`, {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`
        }
      });

      setTimeout(() => {
        onLogin({
          token: response.data.access_token,
          user: profileResponse.data
        });
      }, 1000);

    } catch (error) {
      setMessage('Ошибка регистрации: ' + (error.response?.data?.detail || 'Ошибка сервера'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="logo">DataCleaner</div>

        <div className="form-toggle">
          <button
            className={`toggle-btn ${activeForm === 'login' ? 'active' : ''}`}
            onClick={() => switchForm('login')}
          >
            Вход
          </button>
          <button
            className={`toggle-btn ${activeForm === 'register' ? 'active' : ''}`}
            onClick={() => switchForm('register')}
          >
            Регистрация
          </button>
        </div>

        {message && (
          <div className={`auth-message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <form
          className={`auth-form ${activeForm === 'login' ? 'active' : ''}`}
          onSubmit={handleLoginSubmit}
        >
          <h2>Вход в аккаунт</h2>

          <div className="input-group">
            <label htmlFor="login-email">Email</label>
            <input
              type="email"
              id="login-email"
              placeholder="example@mail.com"
              required
              value={loginData.email}
              onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Пароль</label>
            <input
              type="password"
              id="login-password"
              placeholder="Введите пароль"
              required
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>

          <div className="checkbox-group">
            <input type="checkbox" id="remember-me" />
            <label htmlFor="remember-me">Запомнить меня</label>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Загрузка...' : 'Войти'}
          </button>

          <div className="form-footer">
            <a href="#">Забыли пароль?</a>
          </div>
        </form>

        <form
          className={`auth-form ${activeForm === 'register' ? 'active' : ''}`}
          onSubmit={handleRegisterSubmit}
        >
          <h2>Создание аккаунта</h2>

          <div className="input-group">
            <label htmlFor="register-name">Имя</label>
            <input
              type="text"
              id="register-name"
              placeholder="Ваше имя"
              required
              value={registerData.name}
              onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label htmlFor="register-email">Email</label>
            <input
              type="email"
              id="register-email"
              placeholder="example@mail.com"
              required
              value={registerData.email}
              onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label htmlFor="register-password">Пароль</label>
            <input
              type="password"
              id="register-password"
              placeholder="Не менее 6 символов"
              required
              value={registerData.password}
              onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label htmlFor="register-confirm-password">Подтвердите пароль</label>
            <input
              type="password"
              id="register-confirm-password"
              placeholder="Повторите пароль"
              required
              value={registerData.confirmPassword}
              onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </div>

          <div className="checkbox-group">
            <input type="checkbox" id="agree-terms" required />
            <label htmlFor="agree-terms">
              Я согласен с условиями использования
            </label>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>

          <div className="form-footer">
            Уже есть аккаунт?{' '}
            <button
              type="button"
              className="switch-to-login"
              onClick={() => switchForm('login')}
            >
              Войти
            </button>

                <button
                  onClick={() => onLogin({
                    token: 'test-token',
                    user: { name: 'Пользователь', email: 'test@test.com' }
                  })}
                  style={{
                    marginTop: '10px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '4px',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                >
                  Войти (без авторизации)
                </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
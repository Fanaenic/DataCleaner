import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const API_BASE = 'http://localhost:8000';

const Auth = ({ onLogin }) => {
  const [activeForm, setActiveForm] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Состояния для форм
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  const switchForm = (formName) => {
    setActiveForm(formName);
    setMessage('');
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
    if (password.match(/\d/)) strength += 25;
    if (password.match(/[^a-zA-Z\d]/)) strength += 25;
    return strength;
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
      setMessage('✅ Вход выполнен успешно!');

      // Получаем профиль пользователя
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
      setMessage('❌ Ошибка входа: ' + (error.response?.data?.detail || 'Неверный email или пароль'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (registerData.password !== registerData.confirmPassword) {
      setMessage('❌ Пароли не совпадают!');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setMessage('❌ Пароль должен содержать не менее 6 символов!');
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
      setMessage('✅ Регистрация завершена! Вход выполнен.');

      // Получаем профиль пользователя
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
      setMessage('❌ Ошибка регистрации: ' + (error.response?.data?.detail || 'Ошибка сервера'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (password) => {
    setRegisterData(prev => ({ ...prev, password }));
    setPasswordStrength(calculatePasswordStrength(password));
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="logo">^_^</div>

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
          <div className={`auth-message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {/* Форма входа */}
        <form
          className={`auth-form ${activeForm === 'login' ? 'active' : ''}`}
          onSubmit={handleLoginSubmit}
        >
          <h2 style={{ color: '#18291E' }}>Вход в аккаунт</h2>

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
            {loading ? '⏳ Загрузка...' : 'Войти'}
          </button>

          <div className="form-footer">
            <a style={{ color: '#18291E' }} href="#">Забыли пароль?</a>
          </div>
        </form>

        {/* Форма регистрации */}
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
              onChange={(e) => handlePasswordChange(e.target.value)}
            />
            <div className="password-strength">
              <div
                className="password-strength-bar"
                style={{
                  width: `${passwordStrength}%`,
                  backgroundColor: passwordStrength < 50 ? '#C44536' :
                                 passwordStrength < 75 ? '#E67E22' : '#27AE60'
                }}
              ></div>
            </div>
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
            <label style={{ color: '#18291E' }} htmlFor="agree-terms">
              Я согласен с условиями использования
            </label>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? '⏳ Регистрация...' : 'Зарегистрироваться'}
          </button>

          <div style={{ color: '#18291E' }} className="form-footer">
            Уже есть аккаунт?{' '}
            <button
              type="button"
              style={{ color: '#18291E' }}
              className="switch-to-login"
              onClick={() => switchForm('login')}
            >
              Войти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
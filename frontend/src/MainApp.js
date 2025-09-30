import React, { useState } from 'react';
import './MainApp.css';

const MainApp = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="main-app">
      {/* Шапка */}
      <header className="app-header">
        <div className="header-content">
          <h1>DataCleaner</h1>
          <div className="user-info">
            <span>Добро пожаловать, {user.user.name}!</span>
            <button onClick={onLogout} className="logout-btn">Выйти</button>
          </div>
        </div>
      </header>

      {/* Навигация */}
      <nav className="app-nav">
        <button
          className={`nav-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          📤 Загрузить изображение
        </button>
        <button
          className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 История изображений
        </button>
      </nav>

      {/* Контент */}
      <main className="app-content">
        {activeTab === 'upload' && (
          <div className="upload-section">
            <h2>Загрузка изображения</h2>
            <p>Здесь будет функционал загрузки и обработки изображений</p>

            <div className="demo-buttons">
              <button className="demo-btn primary">
                📁 Выбрать файл
              </button>
              <button className="demo-btn secondary" disabled>
                🚀 Обработать изображение
              </button>
            </div>




          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <h2>История обработки</h2>
            <p>Здесь будет история ваших обработанных изображений</p>

            <div className="history-list">
              <div className="history-item">
                <div className="item-preview">🖼️</div>
                <div className="item-info">
                  <h3>image1.jpg</h3>
                  <p>Обработано: 12.01.2024</p>
                  <p>Размыто лиц: 1</p>
                </div>
                <button className="action-btn">📥 Скачать</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MainApp;
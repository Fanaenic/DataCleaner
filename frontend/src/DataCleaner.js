import React, { useState } from 'react';
import axios from 'axios';
import './DataCleaner.css';

const API_BASE = 'http://localhost:8000';

const DataCleaner = ({ user, onLogout }) => {
  const [file, setFile] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [facesDetected, setFacesDetected] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setMessage('❌ Пожалуйста, выберите файл изображения');
        return;
      }

      setFile(selectedFile);
      setProcessedImage(null);
      setMessage('');
      setFacesDetected(0);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('❌ Пожалуйста, выберите файл сначала');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setMessage('🔄 Обрабатываем изображение...');

    try {
      const response = await axios.post(`${API_BASE}/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${user.token}`
        },
        timeout: 30000,
      });

      setProcessedImage(`${API_BASE}${response.data.processed_url}`);
      setFacesDetected(response.data.faces_detected);
      setMessage(`✅ Успешно обработано! Размыто областей: ${response.data.faces_detected}`);

    } catch (error) {
      console.error('Error details:', error);
      if (error.response?.status === 401) {
        setMessage('❌ Ошибка авторизации. Пожалуйста, войдите снова.');
        onLogout();
      } else if (error.code === 'ECONNABORTED') {
        setMessage('❌ Таймаут запроса. Попробуйте еще раз.');
      } else if (error.response) {
        setMessage(`❌ Ошибка сервера: ${error.response.data.detail}`);
      } else if (error.request) {
        setMessage('❌ Не удалось подключиться к серверу.');
      } else {
        setMessage(`❌ Ошибка: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-cleaner">
      <header className="cleaner-header">
        <div className="header-content">
          <h1>🛡️ Очистка персональных данных</h1>
          <div className="user-info">
            <span>Добро пожаловать, {user.user.name}!</span>
            <button onClick={onLogout} className="logout-btn">Выйти</button>
          </div>
        </div>
        <p>Загрузите фото чтобы автоматически размыть лица и номера автомобилей</p>

        <div className="upload-section">
          <div className="file-input-container">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="file-input"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="file-label">
              📁 Выберите изображение
            </label>
            {file && (
              <div className="file-info">
                <span className="file-name">📄 {file.name}</span>
                <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="upload-button"
          >
            {loading ? '⏳ Обработка...' : '🚀 Обработать изображение'}
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="images-container">
          {file && (
            <div className="image-section">
              <h3>📷 Оригинал</h3>
              <img
                src={URL.createObjectURL(file)}
                alt="Original"
                className="preview-image"
              />
              <div className="image-info">
                <p>Размер: {file.size > 1024 * 1024
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                  : `${(file.size / 1024).toFixed(2)} KB`}</p>
              </div>
            </div>
          )}

          {processedImage && (
            <div className="image-section">
              <h3>✅ Обработанный результат</h3>
              <img
                src={processedImage}
                alt="Processed"
                className="preview-image"
              />
              <div className="image-info">
                <p>Размыто областей: <strong>{facesDetected}</strong></p>
                <p>Автоматически размыта нижняя часть (номера)</p>
              </div>
              <a
                href={processedImage}
                download
                className="download-btn"
              >
                💾 Скачать обработанное изображение
              </a>
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default DataCleaner;
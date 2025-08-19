import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import EditProfile from './EditProfile';

import DiaryTab from './DiaryTab';
import Charts from './Charts';
import RecentRecords from './RecentRecords';
import Home from './Home';
import { User, Settings, BarChart3, Home as HomeIcon, BookOpen } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const renderOverview = () => <Home />;



  const renderDiaryTab = () => {
    return <DiaryTab />;
  };

  const renderAnalytics = () => (
    <div className="analytics-content">
      <Charts />
      <RecentRecords />
    </div>
  );

  // Funciones de traducción
  const translateActivityLevel = (level) => {
    const translations = {
      'sedentary': 'Sedentario (poco o ningún ejercicio)',
      'light': 'Ligero (ejercicio ligero 1-3 días/semana)',
      'moderate': 'Moderado (ejercicio moderado 3-5 días/semana)',
      'active': 'Activo (ejercicio intenso 6-7 días/semana)',
      'very_active': 'Muy activo (ejercicio muy intenso, trabajo físico)'
    };
    return translations[level] || level || 'No especificado';
  };

  const translateGoal = (goal) => {
    const translations = {
      'weight_loss': 'Perder peso',
      'weight_gain': 'Ganar peso',
      'maintain': 'Mantener peso',
      'muscle_gain': 'Ganar músculo',
      'health': 'Mejorar salud general'
    };
    return translations[goal] || goal || 'No especificado';
  };

  const renderSettings = () => (
    <div className="settings-content">
      <h2>Configuración</h2>
      <div className="settings-section">
        <h3>Perfil de Usuario</h3>
        <div className="user-info">
          <p><strong>Nombre:</strong> {user?.profile?.full_name || user?.full_name || 'No especificado'}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Usuario:</strong> {user?.username}</p>
          <p><strong>Edad:</strong> {user?.profile?.age ? `${user.profile.age} años` : 'No especificado'}</p>
          <p><strong>Peso:</strong> {user?.profile?.weight ? `${user.profile.weight} kg` : 'No especificado'}</p>
          <p><strong>Altura:</strong> {user?.profile?.height ? `${user.profile.height} cm` : 'No especificado'}</p>
          <p><strong>Nivel de actividad:</strong> {translateActivityLevel(user?.profile?.activity_level)}</p>
          <p><strong>Objetivo:</strong> {translateGoal(user?.profile?.goal)}</p>
        </div>
        <button 
          className="edit-profile-button"
          onClick={() => setShowEditProfile(true)}
        >
          Editar Perfil
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <h1>RehabiLife</h1>
          </div>
          <nav className="main-nav">
            <button 
              className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="nav-icon">🏠</span>
              Inicio
            </button>

            <button 
              className={`nav-btn ${activeTab === 'diary' ? 'active' : ''}`}
              onClick={() => setActiveTab('diary')}
            >
              <BookOpen className="nav-icon" />
              Diario
            </button>
            <button 
              className={`nav-button ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <span className="nav-icon">📊</span>
              Análisis
            </button>
            <button 
              className={`nav-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="nav-icon">⚙️</span>
              Configuración
            </button>
          </nav>
          <button className="logout-button" onClick={handleLogout}>
            <span className="logout-icon">🚪</span>
            Salir
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="main-content">
          {activeTab === 'overview' && renderOverview()}

        {activeTab === 'diary' && renderDiaryTab()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'settings' && renderSettings()}
        </div>
      </main>

      {showEditProfile && (
        <EditProfile
          onClose={() => setShowEditProfile(false)}
          onSave={() => {
            setShowEditProfile(false);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
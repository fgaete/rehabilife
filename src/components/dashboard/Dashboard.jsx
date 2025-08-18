import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api';
import EditProfile from './EditProfile';
import NutritionTracker from './NutritionTracker';
import ExerciseTracker from './ExerciseTracker';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dailySummary, setDailySummary] = useState(null);
  const [nutritionGoals, setNutritionGoals] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, goalsData, statsData] = await Promise.all([
        apiService.getDailySummary().catch(() => null),
        apiService.getNutritionGoals().catch(() => null),
        apiService.getUserStats().catch(() => null)
      ]);

      setDailySummary(summaryData);
      setNutritionGoals(goalsData);
      setUserStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateProgress = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="welcome-section">
        <h2>¡Hola, {user?.profile?.full_name || user?.username}!</h2>
        <p>{formatDate(new Date())}</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando datos...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-button">
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* Resumen nutricional */}
          <div className="stats-grid">
            <div className="stat-card calories">
              <div className="stat-header">
                <h3>Calorías</h3>
                <span className="stat-icon">🔥</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dailySummary?.total_calories?.toFixed(0) || 0}
                </div>
                <div className="stat-goal">
                  / {nutritionGoals?.calories?.toFixed(0) || 0} kcal
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${calculateProgress(
                        dailySummary?.total_calories || 0, 
                        nutritionGoals?.calories || 0
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="stat-card protein">
              <div className="stat-header">
                <h3>Proteínas</h3>
                <span className="stat-icon">🥩</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dailySummary?.total_protein?.toFixed(1) || 0}
                </div>
                <div className="stat-goal">
                  / {nutritionGoals?.protein?.toFixed(1) || 0} g
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${calculateProgress(
                        dailySummary?.total_protein || 0, 
                        nutritionGoals?.protein || 0
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="stat-card carbs">
              <div className="stat-header">
                <h3>Carbohidratos</h3>
                <span className="stat-icon">🍞</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dailySummary?.total_carbs?.toFixed(1) || 0}
                </div>
                <div className="stat-goal">
                  / {nutritionGoals?.carbs?.toFixed(1) || 0} g
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${calculateProgress(
                        dailySummary?.total_carbs || 0, 
                        nutritionGoals?.carbs || 0
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="stat-card fats">
              <div className="stat-header">
                <h3>Grasas</h3>
                <span className="stat-icon">🥑</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dailySummary?.total_fats?.toFixed(1) || 0}
                </div>
                <div className="stat-goal">
                  / {nutritionGoals?.fats?.toFixed(1) || 0} g
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${calculateProgress(
                        dailySummary?.total_fats || 0, 
                        nutritionGoals?.fats || 0
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="stat-card water">
              <div className="stat-header">
                <h3>Agua</h3>
                <span className="stat-icon">💧</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {(dailySummary?.total_water || 0) / 1000}
                </div>
                <div className="stat-goal">
                  / {(nutritionGoals?.water || 0) / 1000} L
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${calculateProgress(
                        dailySummary?.total_water || 0, 
                        nutritionGoals?.water || 0
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="stat-card entries">
              <div className="stat-header">
                <h3>Registros</h3>
                <span className="stat-icon">📝</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {userStats?.total_food_entries || 0}
                </div>
                <div className="stat-goal">comidas registradas</div>
                <div className="stat-number small">
                  {userStats?.total_water_entries || 0}
                </div>
                <div className="stat-goal">vasos de agua</div>
              </div>
            </div>
          </div>


        </>
      )}
    </div>
  );

  const renderNutrition = () => <NutritionTracker />;

  const renderExercise = () => <ExerciseTracker />;

  const renderAnalytics = () => (
    <div className="analytics-content">
      <h2>Análisis y Estadísticas</h2>
      <p>Dashboard de análisis en desarrollo...</p>
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
              className={`nav-button ${activeTab === 'nutrition' ? 'active' : ''}`}
              onClick={() => setActiveTab('nutrition')}
            >
              <span className="nav-icon">🍽️</span>
              Nutrición
            </button>
            <button 
              className={`nav-button ${activeTab === 'exercise' ? 'active' : ''}`}
              onClick={() => setActiveTab('exercise')}
            >
              <span className="nav-icon">💪</span>
              Ejercicio
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
        {activeTab === 'nutrition' && renderNutrition()}
        {activeTab === 'exercise' && renderExercise()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'settings' && renderSettings()}
        </div>
      </main>

      {showEditProfile && (
        <EditProfile
          onClose={() => setShowEditProfile(false)}
          onSave={() => {
            setShowEditProfile(false);
            loadDashboardData(); // Recargar datos del dashboard
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './TimeTracker.css';

const TimeTracker = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [dailyStats, setDailyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para formularios
  const [showTimeForm, setShowTimeForm] = useState(false);
  const [timeFormData, setTimeFormData] = useState({
    activity_type: 'work',
    duration: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTimeData();
  }, []);

  const loadTimeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      const stats = await apiService.getDailyStats({ target_date: today });
      setDailyStats(stats);
    } catch (error) {
      console.error('Error loading time data:', error);
      setError('Error al cargar los datos de tiempo');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeInputChange = (e) => {
    const { name, value } = e.target;
    setTimeFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimeSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const duration = parseInt(timeFormData.duration);
      
      // Preparar las métricas de actividad basadas en el tipo de actividad
      const currentMetrics = dailyStats?.activity_metrics || {};
      const newActivityMetrics = { ...currentMetrics };

      if (timeFormData.activity_type === 'work') {
        newActivityMetrics.work_minutes = (currentMetrics.work_minutes || 0) + duration;
      } else if (timeFormData.activity_type === 'leisure') {
        newActivityMetrics.leisure_minutes = (currentMetrics.leisure_minutes || 0) + duration;
      } else if (timeFormData.activity_type === 'rest') {
        newActivityMetrics.rest_minutes = (currentMetrics.rest_minutes || 0) + duration;
      } else if (timeFormData.activity_type === 'study') {
        newActivityMetrics.study_minutes = (currentMetrics.study_minutes || 0) + duration;
      } else if (timeFormData.activity_type === 'social') {
        newActivityMetrics.social_minutes = (currentMetrics.social_minutes || 0) + duration;
      }

      const updateData = {
        activity_metrics: newActivityMetrics,
        notes: timeFormData.notes
      };

      // Si ya existen estadísticas para hoy, actualizar; si no, crear nuevas
      if (dailyStats && dailyStats.id) {
        await apiService.updateDailyStats(dailyStats.id, updateData);
      } else {
        await apiService.createDailyStats(updateData);
      }
      
      // Resetear formulario
      setTimeFormData({
        activity_type: 'work',
        duration: '',
        notes: ''
      });
      
      setShowTimeForm(false);
      await loadTimeData();
    } catch (error) {
      console.error('Error adding time entry:', error);
      setError('Error al registrar la actividad');
    } finally {
      setSubmitting(false);
    }
  };

  const timeActivityTypes = [
    { value: 'work', label: 'Trabajo', icon: '💼' },
    { value: 'study', label: 'Estudio', icon: '📚' },
    { value: 'leisure', label: 'Ocio', icon: '🎮' },
    { value: 'social', label: 'Social', icon: '👥' },
    { value: 'rest', label: 'Descanso', icon: '😴' }
  ];

  if (loading) {
    return (
      <div className="time-tracker">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando datos de tiempo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="time-tracker">
      <div className="time-header">
        <h2>Seguimiento de Tiempo</h2>
        <div className="time-nav">
          <button 
            className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            Resumen
          </button>
          <button 
            className={`nav-btn ${activeSection === 'add' ? 'active' : ''}`}
            onClick={() => setActiveSection('add')}
          >
            Registrar
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {activeSection === 'overview' && (
        <div className="time-overview">
          <div className="time-stats">
            <div className="stat-card work">
              <div className="stat-header">
                <h3>Trabajo</h3>
                <span className="stat-icon">💼</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dailyStats?.activity_metrics?.work_minutes || 0}
                </div>
                <div className="stat-label">minutos hoy</div>
              </div>
            </div>

            <div className="stat-card study">
              <div className="stat-header">
                <h3>Estudio</h3>
                <span className="stat-icon">📚</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dailyStats?.activity_metrics?.study_minutes || 0}
                </div>
                <div className="stat-label">minutos hoy</div>
              </div>
            </div>

            <div className="stat-card leisure">
              <div className="stat-header">
                <h3>Ocio</h3>
                <span className="stat-icon">🎮</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dailyStats?.activity_metrics?.leisure_minutes || 0}
                </div>
                <div className="stat-label">minutos hoy</div>
              </div>
            </div>

            <div className="stat-card social">
              <div className="stat-header">
                <h3>Social</h3>
                <span className="stat-icon">👥</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dailyStats?.activity_metrics?.social_minutes || 0}
                </div>
                <div className="stat-label">minutos hoy</div>
              </div>
            </div>

            <div className="stat-card rest">
              <div className="stat-header">
                <h3>Descanso</h3>
                <span className="stat-icon">😴</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dailyStats?.activity_metrics?.rest_minutes || 0}
                </div>
                <div className="stat-label">minutos hoy</div>
              </div>
            </div>

            <div className="stat-card total-time">
              <div className="stat-header">
                <h3>Tiempo Total</h3>
                <span className="stat-icon">⏱️</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {(dailyStats?.activity_metrics?.work_minutes || 0) + 
                   (dailyStats?.activity_metrics?.study_minutes || 0) +
                   (dailyStats?.activity_metrics?.leisure_minutes || 0) +
                   (dailyStats?.activity_metrics?.social_minutes || 0) +
                   (dailyStats?.activity_metrics?.rest_minutes || 0)}
                </div>
                <div className="stat-label">minutos registrados hoy</div>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <button 
              className="quick-action-btn time"
              onClick={() => {
                setActiveSection('add');
                setShowTimeForm(true);
              }}
            >
              <span className="action-icon">⏰</span>
              <span>Registrar Tiempo</span>
            </button>
          </div>

          <div className="time-tips">
            <h3>💡 Consejos de Gestión del Tiempo</h3>
            <div className="tips-grid">
              <div className="tip-card">
                <div className="tip-icon">💼</div>
                <div className="tip-content">
                  <h4>Productividad Laboral</h4>
                  <p>Usa la técnica Pomodoro: 25 minutos de trabajo concentrado seguidos de 5 minutos de descanso.</p>
                </div>
              </div>
              <div className="tip-card">
                <div className="tip-icon">📚</div>
                <div className="tip-content">
                  <h4>Tiempo de Estudio</h4>
                  <p>Divide las sesiones de estudio en bloques de 45-50 minutos para mantener la concentración.</p>
                </div>
              </div>
              <div className="tip-card">
                <div className="tip-icon">😴</div>
                <div className="tip-content">
                  <h4>Descanso Activo</h4>
                  <p>Incluye pausas regulares y tiempo de relajación para mantener el equilibrio mental.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'add' && (
        <div className="time-add">
          <div className="add-options">
            <button 
              className={`option-btn ${showTimeForm ? 'active' : ''}`}
              onClick={() => setShowTimeForm(true)}
            >
              ⏰ Registrar Actividad
            </button>
          </div>

          {showTimeForm && (
            <form onSubmit={handleTimeSubmit} className="time-form">
              <h3>Registrar Tiempo de Actividad</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="activity_type">Tipo de Actividad</label>
                  <select
                    id="activity_type"
                    name="activity_type"
                    value={timeFormData.activity_type}
                    onChange={handleTimeInputChange}
                    required
                  >
                    {timeActivityTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="duration">Duración (minutos)</label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={timeFormData.duration}
                    onChange={handleTimeInputChange}
                    required
                    min="1"
                    max="1440"
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notas (opcional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={timeFormData.notes}
                  onChange={handleTimeInputChange}
                  placeholder="Describe la actividad, logros, observaciones..."
                  rows="3"
                ></textarea>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowTimeForm(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Registrando...' : 'Registrar Tiempo'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
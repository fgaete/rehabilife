import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './ExerciseTracker.css';

const ExerciseTracker = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [dailyStats, setDailyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para formularios
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [exerciseFormData, setExerciseFormData] = useState({
    exercise_type: 'gym',
    duration: '',
    intensity: 'moderate',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadExerciseData();
  }, []);

  const loadExerciseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener estadísticas diarias que incluyen métricas de actividad
      const statsData = await apiService.getDailyStats().catch(() => null);
      setDailyStats(statsData);
    } catch (error) {
      console.error('Error loading exercise data:', error);
      setError('Error al cargar los datos de ejercicio');
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseInputChange = (e) => {
    const { name, value } = e.target;
    setExerciseFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExerciseSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const duration = parseInt(exerciseFormData.duration);
      
      // Preparar las métricas de actividad basadas en el tipo de ejercicio
      const currentMetrics = dailyStats?.activity_metrics || {};
      const newActivityMetrics = { ...currentMetrics };

      if (exerciseFormData.exercise_type === 'gym') {
        newActivityMetrics.gym_sessions = (currentMetrics.gym_sessions || 0) + 1;
        newActivityMetrics.strength_training_minutes = (currentMetrics.strength_training_minutes || 0) + duration;
      } else if (exerciseFormData.exercise_type === 'cardio') {
        newActivityMetrics.cardio_minutes = (currentMetrics.cardio_minutes || 0) + duration;
      } else {
        // Para otros tipos de ejercicio (yoga, natación, deportes, etc.), agregar a cardio
        newActivityMetrics.cardio_minutes = (currentMetrics.cardio_minutes || 0) + duration;
      }

      const updateData = {
        activity_metrics: newActivityMetrics,
        notes: exerciseFormData.notes
      };

      // Si ya existen estadísticas para hoy, actualizar; si no, crear nuevas
      if (dailyStats && dailyStats.id) {
        await apiService.updateDailyStats(dailyStats.id, updateData);
      } else {
        await apiService.createDailyStats(updateData);
      }
      
      // Resetear formulario
      setExerciseFormData({
        exercise_type: 'gym',
        duration: '',
        intensity: 'moderate',
        notes: ''
      });
      
      setShowExerciseForm(false);
      await loadExerciseData();
    } catch (error) {
      console.error('Error adding exercise entry:', error);
      setError('Error al registrar el ejercicio');
    } finally {
      setSubmitting(false);
    }
  };

  const exerciseTypes = [
    { value: 'gym', label: 'Gimnasio', icon: '🏋️' },
    { value: 'cardio', label: 'Cardio', icon: '🏃' },
    { value: 'yoga', label: 'Yoga', icon: '🧘' },
    { value: 'swimming', label: 'Natación', icon: '🏊' },
    { value: 'cycling', label: 'Ciclismo', icon: '🚴' },
    { value: 'walking', label: 'Caminata', icon: '🚶' },
    { value: 'sports', label: 'Deportes', icon: '⚽' },
    { value: 'other', label: 'Otro', icon: '💪' }
  ];

  const intensityLevels = [
    { value: 'light', label: 'Ligero', color: '#48bb78' },
    { value: 'moderate', label: 'Moderado', color: '#ed8936' },
    { value: 'intense', label: 'Intenso', color: '#f56565' }
  ];

  if (loading) {
    return (
      <div className="exercise-tracker">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando datos de ejercicio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exercise-tracker">
      <div className="exercise-header">
        <h2>Seguimiento de Ejercicio</h2>
        <div className="exercise-nav">
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
        <div className="exercise-overview">
          <div className="exercise-stats">
            <div className="stat-card gym">
              <div className="stat-header">
                <h3>Sesiones de Gimnasio</h3>
                <span className="stat-icon">🏋️</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dailyStats?.activity_metrics?.gym_sessions || 0}
                </div>
                <div className="stat-label">Esta semana</div>
              </div>
            </div>

            <div className="stat-card cardio">
              <div className="stat-header">
                <h3>Cardio</h3>
                <span className="stat-icon">🏃</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dailyStats?.activity_metrics?.cardio_minutes || 0}
                </div>
                <div className="stat-label">minutos hoy</div>
              </div>
            </div>

            <div className="stat-card strength">
              <div className="stat-header">
                <h3>Fuerza</h3>
                <span className="stat-icon">💪</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dailyStats?.activity_metrics?.strength_training_minutes || 0}
                </div>
                <div className="stat-label">minutos hoy</div>
              </div>
            </div>

            <div className="stat-card sessions">
              <div className="stat-header">
                <h3>Sesiones Totales</h3>
                <span className="stat-icon">📊</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dailyStats?.activity_metrics?.gym_sessions || 0}
                </div>
                <div className="stat-label">sesiones hoy</div>
              </div>
            </div>

            <div className="stat-card total-time">
              <div className="stat-header">
                <h3>Tiempo Total Ejercicio</h3>
                <span className="stat-icon">⏱️</span>
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {(dailyStats?.activity_metrics?.cardio_minutes || 0) + (dailyStats?.activity_metrics?.strength_training_minutes || 0)}
                </div>
                <div className="stat-label">minutos hoy</div>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <button 
              className="quick-action-btn exercise"
              onClick={() => {
                setActiveSection('add');
                setShowExerciseForm(true);
              }}
            >
              <span className="action-icon">💪</span>
              <span>Registrar Ejercicio</span>
            </button>
          </div>

          <div className="exercise-tips">
            <h3>💡 Consejos de Ejercicio</h3>
            <div className="tips-grid">
              <div className="tip-card">
                <div className="tip-icon">🏋️</div>
                <div className="tip-content">
                  <h4>Entrenamiento de Fuerza</h4>
                  <p>Incluye ejercicios de fuerza 2-3 veces por semana para mantener masa muscular.</p>
                </div>
              </div>
              <div className="tip-card">
                <div className="tip-icon">🏃</div>
                <div className="tip-content">
                  <h4>Cardio Regular</h4>
                  <p>150 minutos de cardio moderado por semana mejoran la salud cardiovascular.</p>
                </div>
              </div>
              <div className="tip-card">
                <div className="tip-icon">🧘</div>
                <div className="tip-content">
                  <h4>Recuperación</h4>
                  <p>El descanso es tan importante como el ejercicio. Incluye días de recuperación.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'add' && (
        <div className="exercise-add">
          <div className="add-options">
            <button 
              className={`option-btn ${showExerciseForm ? 'active' : ''}`}
              onClick={() => setShowExerciseForm(true)}
            >
              💪 Registrar Ejercicio
            </button>
          </div>

          {showExerciseForm && (
            <form onSubmit={handleExerciseSubmit} className="exercise-form">
              <h3>Registrar Sesión de Ejercicio</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="exercise_type">Tipo de Ejercicio</label>
                  <select
                    id="exercise_type"
                    name="exercise_type"
                    value={exerciseFormData.exercise_type}
                    onChange={handleExerciseInputChange}
                    required
                  >
                    {exerciseTypes.map(type => (
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
                    value={exerciseFormData.duration}
                    onChange={handleExerciseInputChange}
                    required
                    min="1"
                    max="300"
                    placeholder="30"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="intensity">Intensidad</label>
                  <select
                    id="intensity"
                    name="intensity"
                    value={exerciseFormData.intensity}
                    onChange={handleExerciseInputChange}
                    required
                  >
                    {intensityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>



              <div className="form-group">
                <label htmlFor="notes">Notas (opcional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={exerciseFormData.notes}
                  onChange={handleExerciseInputChange}
                  placeholder="Describe tu sesión de ejercicio, cómo te sentiste, etc..."
                  rows="3"
                ></textarea>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowExerciseForm(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Registrando...' : 'Registrar Ejercicio'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseTracker;
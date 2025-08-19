import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import WeeklyChart from './WeeklyChart';
import './DiaryTab.css';

const DiaryTab = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState({
    food: [],
    water: [],
    exercise: [],
    leisure: []
  });
  const [showForms, setShowForms] = useState({
    food: false,
    water: false,
    exercise: false,
    leisure: false
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Estados para formularios
  const [foodForm, setFoodForm] = useState({
    name: '',
    quantity: '',
    unit: 'gramos',
    meal_type: 'breakfast',
    category: 'protein'
  });

  const [waterForm, setWaterForm] = useState({
    amount: '',
    notes: ''
  });

  const [exerciseForm, setExerciseForm] = useState({
    exercise_type: 'gym',
    duration: '',
    intensity: 'moderate',
    notes: ''
  });

  const [leisureForm, setLeisureForm] = useState({
    activity_type: 'work',
    duration: '',
    notes: ''
  });

  useEffect(() => {
    loadAllRecords();
  }, []);

  const loadAllRecords = async () => {
    setLoading(true);
    try {
      // Cargar registros de comida
      const foodData = await apiService.getFoodEntries();
      const recentFood = foodData.slice(0, 10);

      // Cargar registros de agua
      const waterData = await apiService.getWaterEntries();
      const recentWater = waterData.slice(0, 10);

      // Cargar estadísticas diarias para ejercicio y ocio
      const dailyStatsData = await apiService.getDailyStats();
      
      // Procesar ejercicios y ocio de las estadísticas diarias
      const exerciseRecords = [];
      const leisureRecords = [];

      dailyStatsData.forEach(stat => {
        const activityMetrics = stat.activity_metrics || {};
        
        // Agregar registros de ejercicio si existen
        if (activityMetrics.gym_sessions > 0 || activityMetrics.cardio_minutes > 0 || activityMetrics.strength_training_minutes > 0) {
          exerciseRecords.push({
            id: `${stat.id}-exercise`,
            date: stat.date,
            gym_sessions: activityMetrics.gym_sessions || 0,
            cardio_minutes: activityMetrics.cardio_minutes || 0,
            strength_training_minutes: activityMetrics.strength_training_minutes || 0,
            notes: stat.notes || ''
          });
        }

        // Agregar registros de ocio si existen
        if (activityMetrics.work_minutes > 0 || activityMetrics.leisure_minutes > 0 || 
            activityMetrics.rest_minutes > 0 || activityMetrics.study_minutes > 0 || 
            activityMetrics.social_minutes > 0) {
          leisureRecords.push({
            id: `${stat.id}-leisure`,
            date: stat.date,
            work_minutes: activityMetrics.work_minutes || 0,
            leisure_minutes: activityMetrics.leisure_minutes || 0,
            rest_minutes: activityMetrics.rest_minutes || 0,
            study_minutes: activityMetrics.study_minutes || 0,
            social_minutes: activityMetrics.social_minutes || 0,
            notes: stat.notes || ''
          });
        }
      });

      setRecords({
        food: recentFood,
        water: recentWater,
        exercise: exerciseRecords.slice(0, 10),
        leisure: leisureRecords.slice(0, 10)
      });
    } catch (error) {
      console.error('Error loading records:', error);
      setError('Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, recordId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      return;
    }

    try {
      if (type === 'food') {
        await apiService.deleteFoodEntry(recordId);
      } else if (type === 'water') {
        await apiService.deleteWaterEntry(recordId);
      } else if (type === 'exercise' || type === 'leisure') {
        // Para ejercicio y ocio, necesitamos eliminar las estadísticas diarias
        const statsId = recordId.split('-')[0];
        await apiService.deleteDailyStats(statsId);
      }
      
      await loadAllRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      setError('Error al eliminar el registro');
    }
  };

  const handleEdit = (type, record) => {
    setEditingRecord({ type, record });
    
    if (type === 'food') {
      setFoodForm({
        name: record.name,
        quantity: record.quantity.toString(),
        unit: record.unit,
        meal_type: record.meal_type,
        category: record.category || 'protein'
      });
    } else if (type === 'water') {
      setWaterForm({
        amount: record.amount.toString(),
        notes: record.notes || ''
      });
    }
    
    setShowForms({ ...showForms, [type]: true });
  };

  const handleSubmit = async (type) => {
    setSubmitting(true);
    try {
      if (type === 'food') {
        const data = {
          food_name: foodForm.name,
          quantity: parseFloat(foodForm.quantity),
          unit: foodForm.unit,
          meal_type: foodForm.meal_type,
          category: foodForm.category
        };
        
        if (editingRecord) {
          await apiService.updateFoodEntry(editingRecord.record.id, data);
        } else {
          await apiService.addFoodEntry(data);
        }
      } else if (type === 'water') {
        const data = {
          ...waterForm,
          amount: parseFloat(waterForm.amount)
        };
        
        if (editingRecord) {
          await apiService.updateWaterEntry(editingRecord.record.id, data);
        } else {
          await apiService.addWaterEntry(data);
        }
      } else if (type === 'exercise') {
        const duration = parseInt(exerciseForm.duration);
        const activityMetrics = {};
        
        if (exerciseForm.exercise_type === 'gym') {
          activityMetrics.gym_sessions = 1;
          activityMetrics.strength_training_minutes = duration;
        } else {
          activityMetrics.cardio_minutes = duration;
        }
        
        const data = {
          activity_metrics: activityMetrics,
          notes: exerciseForm.notes
        };
        
        await apiService.createDailyStats(data);
      } else if (type === 'leisure') {
        const duration = parseInt(leisureForm.duration);
        const activityMetrics = {};
        
        activityMetrics[`${leisureForm.activity_type}_minutes`] = duration;
        
        const data = {
          activity_metrics: activityMetrics,
          notes: leisureForm.notes
        };
        
        await apiService.createDailyStats(data);
      }
      
      // Resetear formularios
      setFoodForm({ name: '', quantity: '', unit: 'gramos', meal_type: 'breakfast', category: 'protein' });
      setWaterForm({ amount: '', notes: '' });
      setExerciseForm({ exercise_type: 'gym', duration: '', intensity: 'moderate', notes: '' });
      setLeisureForm({ activity_type: 'work', duration: '', notes: '' });
      
      setShowForms({ ...showForms, [type]: false });
      setEditingRecord(null);
      await loadAllRecords();
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Error al guardar el registro');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="diary-tab">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando registros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="diary-tab">
      <div className="diary-header">
        <h2>📖 Diario de Actividades</h2>
        <p>Últimos 10 registros de cada categoría</p>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="diary-sections">
        {/* Sección de Alimentación */}
        <div className="diary-section">
          <div className="section-header">
            <h3>🍽️ Alimentación</h3>
            <button 
              className="register-btn"
              onClick={() => setShowForms({ ...showForms, food: !showForms.food })}
            >
              {showForms.food ? 'Cancelar' : 'Registrar Comida'}
            </button>
          </div>

          {showForms.food && (
            <div className="form-container">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit('food'); }}>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Nombre del alimento"
                    value={foodForm.name}
                    onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={foodForm.quantity}
                    onChange={(e) => setFoodForm({ ...foodForm, quantity: e.target.value })}
                    required
                  />
                  <select
                    value={foodForm.unit}
                    onChange={(e) => setFoodForm({ ...foodForm, unit: e.target.value })}
                  >
                    <option value="gramos">Gramos</option>
                    <option value="ml">ML</option>
                    <option value="unidades">Unidades</option>
                  </select>
                  <select
                    value={foodForm.meal_type}
                    onChange={(e) => setFoodForm({ ...foodForm, meal_type: e.target.value })}
                  >
                    <option value="breakfast">Desayuno</option>
                    <option value="lunch">Almuerzo</option>
                    <option value="dinner">Cena</option>
                    <option value="snack">Snack</option>
                  </select>
                  <select
                    value={foodForm.category}
                    onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                  >
                    <option value="protein">Proteínas</option>
                    <option value="carbs">Carbohidratos</option>
                    <option value="fats">Grasas</option>
                    <option value="vegetables">Vegetales</option>
                    <option value="fruits">Frutas</option>
                    <option value="dairy">Lácteos</option>
                    <option value="beverages">Bebidas</option>
                    <option value="alcohol">Alcohol</option>
                    <option value="processed">Procesados</option>
                    <option value="supplements">Suplementos</option>
                  </select>
                </div>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : (editingRecord ? 'Actualizar' : 'Registrar')}
                </button>
              </form>
            </div>
          )}

          <div className="records-table">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Alimento</th>
                  <th>Cantidad</th>
                  <th>Tipo de Comida</th>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.food.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-records">No hay registros de alimentación</td>
                  </tr>
                ) : (
                  records.food.map(record => (
                    <tr key={record.id}>
                      <td>{formatDate(record.created_at)} {formatTime(record.created_at)}</td>
                      <td>{record.name}</td>
                      <td>{record.quantity} {record.unit}</td>
                      <td>{record.meal_type}</td>
                      <td>{record.category}</td>
                      <td>
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit('food', record)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete('food', record.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección de Hidratación */}
        <div className="diary-section">
          <div className="section-header">
            <h3>💧 Hidratación</h3>
            <button 
              className="register-btn"
              onClick={() => setShowForms({ ...showForms, water: !showForms.water })}
            >
              {showForms.water ? 'Cancelar' : 'Registrar Agua'}
            </button>
          </div>

          {showForms.water && (
            <div className="form-container">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit('water'); }}>
                <div className="form-row">
                  <input
                    type="number"
                    placeholder="Cantidad (ml)"
                    value={waterForm.amount}
                    onChange={(e) => setWaterForm({ ...waterForm, amount: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Notas (opcional)"
                    value={waterForm.notes}
                    onChange={(e) => setWaterForm({ ...waterForm, notes: e.target.value })}
                  />
                </div>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : (editingRecord ? 'Actualizar' : 'Registrar')}
                </button>
              </form>
            </div>
          )}

          <div className="records-table">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cantidad</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.water.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-records">No hay registros de hidratación</td>
                  </tr>
                ) : (
                  records.water.map(record => (
                    <tr key={record.id}>
                      <td>{formatDate(record.created_at)} {formatTime(record.created_at)}</td>
                      <td>{record.amount} ml</td>
                      <td>{record.notes || '-'}</td>
                      <td>
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit('water', record)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete('water', record.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección de Ejercicio */}
        <div className="diary-section">
          <div className="section-header">
            <h3>🏋️ Ejercicio</h3>
            <button 
              className="register-btn"
              onClick={() => setShowForms({ ...showForms, exercise: !showForms.exercise })}
            >
              {showForms.exercise ? 'Cancelar' : 'Registrar Ejercicio'}
            </button>
          </div>

          {showForms.exercise && (
            <div className="form-container">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit('exercise'); }}>
                <div className="form-row">
                  <select
                    value={exerciseForm.exercise_type}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, exercise_type: e.target.value })}
                  >
                    <option value="gym">🏋️ Gimnasio</option>
                    <option value="cardio">🏃 Cardio/Running</option>
                    <option value="yoga">🧘 Yoga</option>
                    <option value="swimming">🏊 Natación</option>
                    <option value="cycling">🚴 Ciclismo</option>
                    <option value="walking">🚶 Caminata</option>
                    <option value="dancing">💃 Baile</option>
                    <option value="martial_arts">🥋 Artes Marciales</option>
                    <option value="tennis">🎾 Tenis</option>
                    <option value="football">⚽ Fútbol</option>
                    <option value="basketball">🏀 Básquetbol</option>
                    <option value="volleyball">🏐 Voleibol</option>
                    <option value="climbing">🧗 Escalada</option>
                    <option value="pilates">🤸 Pilates</option>
                    <option value="crossfit">💪 CrossFit</option>
                    <option value="boxing">🥊 Boxeo</option>
                    <option value="hiking">🥾 Senderismo</option>
                    <option value="skateboarding">🛹 Skateboard</option>
                    <option value="surfing">🏄 Surf</option>
                    <option value="other">🏃 Otro</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Duración (minutos)"
                    value={exerciseForm.duration}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, duration: e.target.value })}
                    required
                  />
                  <select
                    value={exerciseForm.intensity}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, intensity: e.target.value })}
                  >
                    <option value="low">Baja</option>
                    <option value="moderate">Moderada</option>
                    <option value="high">Alta</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Notas (opcional)"
                    value={exerciseForm.notes}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })}
                  />
                </div>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Registrar'}
                </button>
              </form>
            </div>
          )}

          <div className="records-table">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Sesiones Gym</th>
                  <th>Cardio (min)</th>
                  <th>Fuerza (min)</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.exercise.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-records">No hay registros de ejercicio</td>
                  </tr>
                ) : (
                  records.exercise.map(record => (
                    <tr key={record.id}>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.gym_sessions}</td>
                      <td>{record.cardio_minutes}</td>
                      <td>{record.strength_training_minutes}</td>
                      <td>{record.notes || '-'}</td>
                      <td>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete('exercise', record.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección de Ocio */}
        <div className="diary-section">
          <div className="section-header">
            <h3>🎮 Ocio</h3>
            <button 
              className="register-btn"
              onClick={() => setShowForms({ ...showForms, leisure: !showForms.leisure })}
            >
              {showForms.leisure ? 'Cancelar' : 'Registrar Actividad'}
            </button>
          </div>

          {showForms.leisure && (
            <div className="form-container">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit('leisure'); }}>
                <div className="form-row">
                  <select
                    value={leisureForm.activity_type}
                    onChange={(e) => setLeisureForm({ ...leisureForm, activity_type: e.target.value })}
                  >
                    <option value="work">Trabajo</option>
                    <option value="study">Estudio</option>
                    <option value="leisure">Ocio</option>
                    <option value="social">Social</option>
                    <option value="rest">Descanso</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Duración (minutos)"
                    value={leisureForm.duration}
                    onChange={(e) => setLeisureForm({ ...leisureForm, duration: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Notas (opcional)"
                    value={leisureForm.notes}
                    onChange={(e) => setLeisureForm({ ...leisureForm, notes: e.target.value })}
                  />
                </div>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Registrar'}
                </button>
              </form>
            </div>
          )}

          <div className="records-table">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Trabajo (min)</th>
                  <th>Estudio (min)</th>
                  <th>Ocio (min)</th>
                  <th>Social (min)</th>
                  <th>Descanso (min)</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.leisure.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-records">No hay registros de actividades de tiempo</td>
                  </tr>
                ) : (
                  records.leisure.map(record => (
                    <tr key={record.id}>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.work_minutes}</td>
                      <td>{record.study_minutes}</td>
                      <td>{record.leisure_minutes}</td>
                      <td>{record.social_minutes}</td>
                      <td>{record.rest_minutes}</td>
                      <td>{record.notes || '-'}</td>
                      <td>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete('leisure', record.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Resumen del Día */}
      <div className="daily-summary">
        <h3>📊 Resumen del Día</h3>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon">🍽️</div>
            <div className="summary-content">
              <h4>Alimentación</h4>
              <p>{records.food.filter(record => {
                const today = new Date().toDateString();
                const recordDate = new Date(record.created_at).toDateString();
                return recordDate === today;
              }).length} registros hoy</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">💧</div>
            <div className="summary-content">
              <h4>Hidratación</h4>
              <p>{records.water.filter(record => {
                const today = new Date().toDateString();
                const recordDate = new Date(record.created_at).toDateString();
                return recordDate === today;
              }).reduce((total, record) => total + record.amount, 0)} ml hoy</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">🏋️</div>
            <div className="summary-content">
              <h4>Ejercicio</h4>
              <p>{records.exercise.filter(record => {
                const today = new Date().toDateString();
                const recordDate = new Date(record.date).toDateString();
                return recordDate === today;
              }).reduce((total, record) => total + (record.cardio_minutes || 0) + (record.strength_training_minutes || 0), 0)} min hoy</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">🎮</div>
            <div className="summary-content">
              <h4>Ocio</h4>
              <p>{records.leisure.filter(record => {
                const today = new Date().toDateString();
                const recordDate = new Date(record.date).toDateString();
                return recordDate === today;
              }).reduce((total, record) => total + (record.work_minutes || 0) + (record.study_minutes || 0) + (record.leisure_minutes || 0) + (record.social_minutes || 0) + (record.rest_minutes || 0), 0)} min hoy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico Semanal */}
      <WeeklyChart />
    </div>
  );
};

export default DiaryTab;
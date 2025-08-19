import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './RecentRecords.css';

const RecentRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'food', 'exercise'
  const [editingRecord, setEditingRecord] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadRecentRecords();
  }, []);

  const loadRecentRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener entradas de nutrición de los últimos días
      const nutritionEntries = await apiService.getNutritionEntries({ limit: 15 });
      
      // Obtener estadísticas diarias de los últimos días para ejercicios
      const dailyStatsPromises = [];
      for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyStatsPromises.push(
          apiService.getDailyStats({ target_date: dateStr }).catch(() => null)
        );
      }

      const dailyStatsResults = await Promise.all(dailyStatsPromises);
      
      // Procesar entradas de nutrición
      const foodRecords = nutritionEntries.map(entry => ({
        id: entry._id || entry.id,
        type: entry.entry_type === 'water' ? 'water' : 'food',
        category: entry.entry_type === 'water' ? 'Hidratación' : 'Alimentación',
        name: entry.entry_type === 'water' ? `${entry.amount}ml de agua` : entry.food_name,
        details: entry.entry_type === 'water' 
          ? `${entry.amount}ml` 
          : `${entry.quantity} ${entry.unit} - ${entry.meal_type}`,
        calories: entry.entry_type === 'water' ? 0 : (entry.nutrition?.calories || 0),
        timestamp: new Date(entry.created_at || entry.timestamp),
        icon: entry.entry_type === 'water' ? '💧' : getMealIcon(entry.meal_type)
      }));

      // Procesar ejercicios de las estadísticas diarias
      const exerciseRecords = [];
      dailyStatsResults.forEach(stats => {
        if (stats && stats.activity_metrics) {
          const date = new Date(stats.date || stats.created_at);
          const metrics = stats.activity_metrics;
          
          if (metrics.gym_sessions > 0) {
            exerciseRecords.push({
              id: `gym-${stats._id || stats.id}-${date.getTime()}`,
              type: 'exercise',
              category: 'Ejercicio',
              name: 'Sesión de Gimnasio',
              details: `${metrics.gym_sessions} sesión(es), ${metrics.strength_training_minutes || 0} min`,
              calories: metrics.calories_burned || 0,
              timestamp: date,
              icon: '🏋️'
            });
          }
          
          if (metrics.cardio_minutes > 0) {
            exerciseRecords.push({
              id: `cardio-${stats._id || stats.id}-${date.getTime()}`,
              type: 'exercise',
              category: 'Ejercicio',
              name: 'Ejercicio Cardiovascular',
              details: `${metrics.cardio_minutes} minutos`,
              calories: metrics.calories_burned || 0,
              timestamp: date,
              icon: '🏃'
            });
          }
        }
      });

      // Combinar y ordenar todos los registros
      const allRecords = [...foodRecords, ...exerciseRecords]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 20);

      setRecords(allRecords);
    } catch (error) {
      console.error('Error loading recent records:', error);
      setError('Error al cargar los registros recientes');
    } finally {
      setLoading(false);
    }
  };

  const getMealIcon = (mealType) => {
    const icons = {
      'breakfast': '🌅',
      'snack_morning': '🍎',
      'lunch': '🍽️',
      'snack_afternoon': '🥨',
      'dinner': '🌙',
      'snack_evening': '🍪',
      'other': '🍴'
    };
    return icons[mealType] || '🍴';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor((now - date) / (1000 * 60));
      return `Hace ${minutes} min`;
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} h`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    if (record.type === 'food' || record.type === 'water') {
      setEditFormData({
        food_name: record.type === 'water' ? 'Agua' : record.name,
        quantity: record.type === 'water' ? record.details.split('ml')[0] : '1',
        unit: record.type === 'water' ? 'ml' : 'porción',
        meal_type: record.type === 'water' ? 'water' : 'breakfast'
      });
    } else {
      setEditFormData({
        exercise_type: record.name.includes('Gimnasio') ? 'gym' : 'cardio',
        duration: record.details.split(' min')[0].split(', ')[1] || '30',
        notes: ''
      });
    }
    setShowEditModal(true);
  };

  const handleDelete = async (record) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      return;
    }

    setDeleting(record.id);
    try {
      if (record.type === 'food' || record.type === 'water') {
        await apiService.deleteNutritionEntry(record.id, record.type);
      } else if (record.type === 'exercise') {
        // Para ejercicios, extraer el ID de las estadísticas diarias del ID del registro
        const statsId = record.id.split('-')[1];
        if (statsId && statsId !== 'undefined') {
          await apiService.deleteDailyStats(statsId);
        } else {
          throw new Error('No se pudo identificar el registro de ejercicio para eliminar');
        }
      }
      
      // Recargar los registros después de eliminar
      await loadRecentRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      setError('Error al eliminar el registro');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecord.type === 'food' || editingRecord.type === 'water') {
        // Actualizar entrada de nutrición
        const updateData = {
          food_name: editFormData.food_name,
          quantity: parseFloat(editFormData.quantity),
          unit: editFormData.unit,
          meal_type: editFormData.meal_type
        };
        
        // Nota: Necesitaríamos una función updateNutritionEntry en el API
        console.log('Actualizar nutrición:', editingRecord.id, updateData);
        alert('La edición de registros será implementada próximamente');
      } else {
        // Actualizar ejercicio
        console.log('Actualizar ejercicio:', editingRecord.id, editFormData);
        alert('La edición de ejercicios será implementada próximamente');
      }
      
      setShowEditModal(false);
      setEditingRecord(null);
      // await loadRecentRecords(); // Descomentar cuando las funciones estén implementadas
    } catch (error) {
      console.error('Error updating record:', error);
      setError('Error al actualizar el registro');
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true;
    if (filter === 'food') return record.type === 'food' || record.type === 'water';
    if (filter === 'exercise') return record.type === 'exercise';
    return true;
  });

  if (loading) {
    return (
      <div className="recent-records">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando registros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recent-records">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadRecentRecords} className="retry-btn">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-records">
      <div className="records-header">
        <h2>Registros Recientes</h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button 
            className={`filter-btn ${filter === 'food' ? 'active' : ''}`}
            onClick={() => setFilter('food')}
          >
            Alimentación
          </button>
          <button 
            className={`filter-btn ${filter === 'exercise' ? 'active' : ''}`}
            onClick={() => setFilter('exercise')}
          >
            Ejercicio
          </button>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <p>No hay registros disponibles</p>
          <small>Comienza registrando tu primera comida o ejercicio</small>
        </div>
      ) : (
        <div className="records-table">
          <div className="table-header">
            <div className="col-icon"></div>
            <div className="col-category">Categoría</div>
            <div className="col-name">Descripción</div>
            <div className="col-details">Detalles</div>
            <div className="col-calories">Calorías</div>
            <div className="col-time">Tiempo</div>
            <div className="col-actions">Acciones</div>
          </div>
          
          <div className="table-body">
            {filteredRecords.map((record) => (
              <div key={record.id} className={`table-row ${record.type}`}>
                <div className="col-icon">
                  <span className="record-icon">{record.icon}</span>
                </div>
                <div className="col-category">
                  <span className={`category-badge ${record.type}`}>
                    {record.category}
                  </span>
                </div>
                <div className="col-name">
                  <span className="record-name">{record.name}</span>
                </div>
                <div className="col-details">
                  <span className="record-details">{record.details}</span>
                </div>
                <div className="col-calories">
                  <span className="calories-value">
                    {record.calories > 0 ? `${Math.round(record.calories)} cal` : '-'}
                  </span>
                </div>
                <div className="col-time">
                  <span className="time-value">{formatTimestamp(record.timestamp)}</span>
                </div>
                <div className="col-actions">
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(record)}
                    title="Editar registro"
                  >
                    ✏️
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(record)}
                    disabled={deleting === record.id}
                    title="Eliminar registro"
                  >
                    {deleting === record.id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && editingRecord && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar {editingRecord.category}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="edit-form">
              {(editingRecord.type === 'food' || editingRecord.type === 'water') ? (
                <>
                  <div className="form-group">
                    <label htmlFor="food_name">Nombre del Alimento</label>
                    <input
                      type="text"
                      id="food_name"
                      name="food_name"
                      value={editFormData.food_name || ''}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="quantity">Cantidad</label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={editFormData.quantity || ''}
                        onChange={handleEditInputChange}
                        required
                        min="0"
                        step="0.1"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="unit">Unidad</label>
                      <select
                        id="unit"
                        name="unit"
                        value={editFormData.unit || ''}
                        onChange={handleEditInputChange}
                        required
                      >
                        <option value="ml">ml</option>
                        <option value="gramos">gramos</option>
                        <option value="porción">porción</option>
                        <option value="taza">taza</option>
                        <option value="cucharada">cucharada</option>
                      </select>
                    </div>
                  </div>
                  
                  {editingRecord.type !== 'water' && (
                    <div className="form-group">
                      <label htmlFor="meal_type">Momento del Día</label>
                      <select
                        id="meal_type"
                        name="meal_type"
                        value={editFormData.meal_type || ''}
                        onChange={handleEditInputChange}
                        required
                      >
                        <option value="breakfast">Desayuno</option>
                        <option value="snack_morning">Colación Mañana</option>
                        <option value="lunch">Almuerzo</option>
                        <option value="snack_afternoon">Colación Tarde</option>
                        <option value="dinner">Cena</option>
                        <option value="snack_evening">Colación Noche</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="exercise_type">Tipo de Ejercicio</label>
                    <select
                      id="exercise_type"
                      name="exercise_type"
                      value={editFormData.exercise_type || ''}
                      onChange={handleEditInputChange}
                      required
                    >
                      <option value="gym">🏋️ Gimnasio</option>
                      <option value="cardio">🏃 Cardio</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="duration">Duración (minutos)</label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      value={editFormData.duration || ''}
                      onChange={handleEditInputChange}
                      required
                      min="1"
                      max="300"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="notes">Notas</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={editFormData.notes || ''}
                      onChange={handleEditInputChange}
                      rows="3"
                      placeholder="Notas adicionales..."
                    ></textarea>
                  </div>
                </>
              )}
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentRecords;
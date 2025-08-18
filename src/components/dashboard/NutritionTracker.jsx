import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './NutritionTracker.css';

const NutritionTracker = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [dailySummary, setDailySummary] = useState(null);
  const [nutritionGoals, setNutritionGoals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para formularios
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [showWaterForm, setShowWaterForm] = useState(false);
  const [foodFormData, setFoodFormData] = useState({
    food_name: '',
    quantity: '',
    unit: 'gramos',
    meal_type: 'breakfast',
    category: 'protein',
    nutrition: {
      calories: '',
      protein: '',
      carbs: '',
      fats: ''
    },
    notes: ''
  });
  const [waterAmount, setWaterAmount] = useState(250);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadNutritionData();
  }, []);

  const loadNutritionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, goalsData] = await Promise.all([
        apiService.getDailySummary().catch(() => null),
        apiService.getNutritionGoals().catch(() => null)
      ]);

      setDailySummary(summaryData);
      setNutritionGoals(goalsData);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
      setError('Error al cargar los datos nutricionales');
    } finally {
      setLoading(false);
    }
  };

  const handleFoodInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('nutrition.')) {
      const nutritionField = name.split('.')[1];
      setFoodFormData(prev => ({
        ...prev,
        nutrition: {
          ...prev.nutrition,
          [nutritionField]: value
        }
      }));
    } else {
      setFoodFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const foodData = {
        ...foodFormData,
        quantity: parseFloat(foodFormData.quantity),
        nutrition: {
          calories: parseFloat(foodFormData.nutrition.calories) || 0,
          protein: parseFloat(foodFormData.nutrition.protein) || 0,
          carbs: parseFloat(foodFormData.nutrition.carbs) || 0,
          fats: parseFloat(foodFormData.nutrition.fats) || 0
        }
      };

      await apiService.addFoodEntry(foodData);
      
      // Resetear formulario
      setFoodFormData({
        food_name: '',
        quantity: '',
        unit: 'gramos',
        meal_type: 'breakfast',
        category: 'protein',
        nutrition: {
          calories: '',
          protein: '',
          carbs: '',
          fats: ''
        },
        notes: ''
      });
      
      setShowFoodForm(false);
      await loadNutritionData();
    } catch (error) {
      console.error('Error adding food entry:', error);
      setError('Error al registrar el alimento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWaterSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiService.addWaterEntry({ amount: waterAmount });
      setWaterAmount(250);
      setShowWaterForm(false);
      await loadNutritionData();
    } catch (error) {
      console.error('Error adding water entry:', error);
      setError('Error al registrar el agua');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateProgress = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const mealTypes = [
    { value: 'breakfast', label: 'Desayuno' },
    { value: 'snack_morning', label: 'Colación Mañana' },
    { value: 'lunch', label: 'Almuerzo' },
    { value: 'snack_afternoon', label: 'Colación Tarde' },
    { value: 'dinner', label: 'Cena' },
    { value: 'snack_evening', label: 'Colación Noche' },
    { value: 'other', label: 'Otro' }
  ];

  const foodCategories = [
    { value: 'protein', label: 'Proteínas' },
    { value: 'carbs', label: 'Carbohidratos' },
    { value: 'fats', label: 'Grasas' },
    { value: 'vegetables', label: 'Vegetales' },
    { value: 'fruits', label: 'Frutas' },
    { value: 'dairy', label: 'Lácteos' },
    { value: 'beverages', label: 'Bebidas' },
    { value: 'processed', label: 'Procesados' },
    { value: 'supplements', label: 'Suplementos' }
  ];

  const waterPresets = [125, 250, 500, 750, 1000];

  if (loading) {
    return (
      <div className="nutrition-tracker">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando datos nutricionales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nutrition-tracker">
      <div className="nutrition-header">
        <h2>Seguimiento Nutricional</h2>
        <div className="nutrition-nav">
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
        <div className="nutrition-overview">
          <div className="nutrition-stats">
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
                  / {nutritionGoals?.calories?.toFixed(0) || 2000} kcal
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${calculateProgress(
                        dailySummary?.total_calories || 0, 
                        nutritionGoals?.calories || 2000
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
                  / {nutritionGoals?.protein?.toFixed(1) || 150} g
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${calculateProgress(
                        dailySummary?.total_protein || 0, 
                        nutritionGoals?.protein || 150
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
                  / {nutritionGoals?.carbs?.toFixed(1) || 250} g
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${calculateProgress(
                        dailySummary?.total_carbs || 0, 
                        nutritionGoals?.carbs || 250
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
                  {((dailySummary?.total_water || 0) / 1000).toFixed(1)}
                </div>
                <div className="stat-goal">
                  / {((nutritionGoals?.water || 2000) / 1000).toFixed(1)} L
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${calculateProgress(
                        dailySummary?.total_water || 0, 
                        nutritionGoals?.water || 2000
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <button 
              className="quick-action-btn food"
              onClick={() => {
                setActiveSection('add');
                setShowFoodForm(true);
              }}
            >
              <span className="action-icon">🍽️</span>
              <span>Agregar Comida</span>
            </button>
            <button 
              className="quick-action-btn water"
              onClick={() => {
                setActiveSection('add');
                setShowWaterForm(true);
              }}
            >
              <span className="action-icon">💧</span>
              <span>Agregar Agua</span>
            </button>
          </div>
        </div>
      )}

      {activeSection === 'add' && (
        <div className="nutrition-add">
          <div className="add-options">
            <button 
              className={`option-btn ${showFoodForm ? 'active' : ''}`}
              onClick={() => {
                setShowFoodForm(true);
                setShowWaterForm(false);
              }}
            >
              🍽️ Registrar Comida
            </button>
            <button 
              className={`option-btn ${showWaterForm ? 'active' : ''}`}
              onClick={() => {
                setShowWaterForm(true);
                setShowFoodForm(false);
              }}
            >
              💧 Registrar Agua
            </button>
          </div>

          {showFoodForm && (
            <form onSubmit={handleFoodSubmit} className="food-form">
              <h3>Registrar Alimento</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="food_name">Nombre del Alimento</label>
                  <input
                    type="text"
                    id="food_name"
                    name="food_name"
                    value={foodFormData.food_name}
                    onChange={handleFoodInputChange}
                    required
                    placeholder="Ej: Pechuga de pollo"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="meal_type">Tipo de Comida</label>
                  <select
                    id="meal_type"
                    name="meal_type"
                    value={foodFormData.meal_type}
                    onChange={handleFoodInputChange}
                    required
                  >
                    {mealTypes.map(meal => (
                      <option key={meal.value} value={meal.value}>
                        {meal.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quantity">Cantidad</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={foodFormData.quantity}
                    onChange={handleFoodInputChange}
                    required
                    min="0"
                    step="0.1"
                    placeholder="100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="unit">Unidad</label>
                  <select
                    id="unit"
                    name="unit"
                    value={foodFormData.unit}
                    onChange={handleFoodInputChange}
                  >
                    <option value="gramos">Gramos</option>
                    <option value="unidades">Unidades</option>
                    <option value="tazas">Tazas</option>
                    <option value="cucharadas">Cucharadas</option>
                    <option value="ml">Mililitros</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="category">Categoría</label>
                  <select
                    id="category"
                    name="category"
                    value={foodFormData.category}
                    onChange={handleFoodInputChange}
                    required
                  >
                    {foodCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="nutrition-inputs">
                <h4>Información Nutricional (por porción)</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nutrition.calories">Calorías</label>
                    <input
                      type="number"
                      id="nutrition.calories"
                      name="nutrition.calories"
                      value={foodFormData.nutrition.calories}
                      onChange={handleFoodInputChange}
                      min="0"
                      step="0.1"
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="nutrition.protein">Proteínas (g)</label>
                    <input
                      type="number"
                      id="nutrition.protein"
                      name="nutrition.protein"
                      value={foodFormData.nutrition.protein}
                      onChange={handleFoodInputChange}
                      min="0"
                      step="0.1"
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="nutrition.carbs">Carbohidratos (g)</label>
                    <input
                      type="number"
                      id="nutrition.carbs"
                      name="nutrition.carbs"
                      value={foodFormData.nutrition.carbs}
                      onChange={handleFoodInputChange}
                      min="0"
                      step="0.1"
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="nutrition.fats">Grasas (g)</label>
                    <input
                      type="number"
                      id="nutrition.fats"
                      name="nutrition.fats"
                      value={foodFormData.nutrition.fats}
                      onChange={handleFoodInputChange}
                      min="0"
                      step="0.1"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notas (opcional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={foodFormData.notes}
                  onChange={handleFoodInputChange}
                  placeholder="Notas adicionales sobre el alimento..."
                  rows="3"
                ></textarea>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowFoodForm(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Registrando...' : 'Registrar Alimento'}
                </button>
              </div>
            </form>
          )}

          {showWaterForm && (
            <form onSubmit={handleWaterSubmit} className="water-form">
              <h3>Registrar Consumo de Agua</h3>
              
              <div className="water-presets">
                <p>Selecciona una cantidad rápida:</p>
                <div className="preset-buttons">
                  {waterPresets.map(amount => (
                    <button
                      key={amount}
                      type="button"
                      className={`preset-btn ${waterAmount === amount ? 'active' : ''}`}
                      onClick={() => setWaterAmount(amount)}
                    >
                      {amount} ml
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="water_amount">Cantidad (ml)</label>
                <input
                  type="number"
                  id="water_amount"
                  value={waterAmount}
                  onChange={(e) => setWaterAmount(parseInt(e.target.value) || 0)}
                  required
                  min="1"
                  max="5000"
                  placeholder="250"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowWaterForm(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Registrando...' : 'Registrar Agua'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default NutritionTracker;
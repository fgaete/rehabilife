import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import './Charts.css';

const Charts = () => {
  const [nutritionData, setNutritionData] = useState(null);
  const [exerciseData, setExerciseData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeklyExerciseData, setWeeklyExerciseData] = useState([]);
  const [weeklyWaterData, setWeeklyWaterData] = useState([]);
  const [combinedWeeklyData, setCombinedWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadChartsData();
  }, []);

  const loadChartsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener entradas de nutrición del día actual
      const nutritionEntries = await ApiService.getNutritionEntries();
      
      // Contar comidas por momento del día
      const mealCounts = {
        breakfast: 0,
        snack_morning: 0,
        lunch: 0,
        snack_afternoon: 0,
        dinner: 0,
        snack_evening: 0,
        other: 0,
        water: 0
      };

      const today = new Date().toISOString().split('T')[0];
      nutritionEntries.forEach(entry => {
        const entryDate = new Date(entry.created_at || entry.timestamp).toISOString().split('T')[0];
        if (entryDate === today) {
          if (entry.entry_type === 'water') {
            mealCounts.water += 1;
          } else {
            mealCounts[entry.meal_type] = (mealCounts[entry.meal_type] || 0) + 1;
          }
        }
      });
      
      setNutritionData({ mealCounts });

      // Obtener estadísticas de ejercicio del día actual
      try {
        const dailyStats = await ApiService.getDailyStats();
        const exerciseStats = {
          gym_sessions: dailyStats?.activity_metrics?.gym_sessions || 0,
          cardio_minutes: dailyStats?.activity_metrics?.cardio_minutes || 0,
          strength_training_minutes: dailyStats?.activity_metrics?.strength_training_minutes || 0,
          total_minutes: (dailyStats?.activity_metrics?.cardio_minutes || 0) + (dailyStats?.activity_metrics?.strength_training_minutes || 0)
        };
        setExerciseData(exerciseStats);
      } catch (exerciseError) {
        console.error('Error loading exercise data:', exerciseError);
        setExerciseData({
          gym_sessions: 0,
          cardio_minutes: 0,
          strength_training_minutes: 0,
          total_minutes: 0
        });
      }

      // Obtener datos de los últimos 7 días para los gráficos semanales
      const weeklyPromises = [];
      const weeklyExercisePromises = [];
      const weeklyWaterPromises = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Datos de comidas
        weeklyPromises.push(
          ApiService.getFoodEntries().then(entries => {
            const dayEntries = entries.filter(entry => {
              const entryDate = new Date(entry.created_at || entry.date).toISOString().split('T')[0];
              return entryDate === dateStr;
            });
            return {
              date: dateStr,
              total_meals: dayEntries.length
            };
          }).catch(() => ({ date: dateStr, total_meals: 0 }))
        );
        
        // Datos de agua
        weeklyWaterPromises.push(
          ApiService.getWaterEntries().then(entries => {
            const waterEntries = entries.filter(entry => {
              const entryDate = new Date(entry.created_at || entry.date).toISOString().split('T')[0];
              return entryDate === dateStr;
            });
            return {
              date: dateStr,
              water_count: waterEntries.length
            };
          }).catch(() => ({ date: dateStr, water_count: 0 }))
        );
        
        // Datos de ejercicio
        weeklyExercisePromises.push(
          ApiService.getDailyStats(dateStr).then(stats => {
            const totalMinutes = (stats?.activity_metrics?.cardio_minutes || 0) + (stats?.activity_metrics?.strength_training_minutes || 0);
            return {
              date: dateStr,
              exercise_minutes: totalMinutes
            };
          }).catch(() => ({ date: dateStr, exercise_minutes: 0 }))
        );
      }

      const [weeklyResults, weeklyWaterResults, weeklyExerciseResults] = await Promise.all([
        Promise.all(weeklyPromises),
        Promise.all(weeklyWaterPromises),
        Promise.all(weeklyExercisePromises)
      ]);
      
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      
      setWeeklyData(weeklyResults.map((data, index) => ({
        ...data,
        day: dayNames[new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).getDay()]
      })));
      
      setWeeklyWaterData(weeklyWaterResults.map((data, index) => ({
        ...data,
        day: dayNames[new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).getDay()]
      })));
      
      setWeeklyExerciseData(weeklyExerciseResults.map((data, index) => ({
        ...data,
        day: dayNames[new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).getDay()]
      })));

      // Crear datos combinados para el gráfico proporcional
      const combinedData = weeklyResults.map((foodData, index) => {
        const waterData = weeklyWaterResults[index];
        const exerciseData = weeklyExerciseResults[index];
        
        // Obtener datos de ocio (simulado por ahora, ya que no tenemos endpoint específico)
        const leisureCount = Math.floor(Math.random() * 3); // Simulado
        
        const totalActivities = (foodData.total_meals || 0) + 
                               (waterData.water_count || 0) + 
                               (exerciseData.exercise_minutes > 0 ? 1 : 0) + 
                               leisureCount;
        
        return {
          date: foodData.date,
          day: dayNames[new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).getDay()],
          food: foodData.total_meals || 0,
          water: waterData.water_count || 0,
          exercise: exerciseData.exercise_minutes > 0 ? 1 : 0,
          leisure: leisureCount,
          total: totalActivities
        };
      });
      
      setCombinedWeeklyData(combinedData);

    } catch (error) {
      console.error('Error loading charts data:', error);
      setError('Error al cargar los datos de gráficos');
    } finally {
      setLoading(false);
    }
  };

  const renderMealCountCard = (count, label, icon, color) => {
    return (
      <div className="meal-count-card">
        <div className="meal-icon" style={{ backgroundColor: color }}>
          <span>{icon}</span>
        </div>
        <div className="meal-info">
          <h4>{label}</h4>
          <div className="meal-count">{count}</div>
          <p>{count === 1 ? 'comida' : 'comidas'}</p>
        </div>
      </div>
    );
  };

  const renderExerciseCard = (value, label, icon, color, unit) => {
    return (
      <div className="meal-count-card">
        <div className="meal-icon" style={{ backgroundColor: color }}>
          <span>{icon}</span>
        </div>
        <div className="meal-info">
          <h4>{label}</h4>
          <div className="meal-count">{value}</div>
          <p>{unit}</p>
        </div>
      </div>
    );
  };

  const renderWeeklyChart = () => {
    if (!weeklyData.length) return null;

    const maxMeals = Math.max(...weeklyData.map(d => d.total_meals || 0), 1);
    
    return (
      <div className="weekly-chart">
        <h3>Comidas Registradas - Últimos 7 días</h3>
        <div className="chart-bars">
          {weeklyData.map((day, index) => {
            const height = ((day.total_meals || 0) / maxMeals) * 100;
            return (
              <div key={index} className="bar-container">
                <div 
                  className="bar" 
                  style={{ 
                    height: `${Math.max(height, 10)}%`,
                    backgroundColor: day.total_meals > 5 ? '#e53e3e' : day.total_meals > 3 ? '#ed8936' : '#48bb78'
                  }}
                >
                  <span className="bar-value">{day.total_meals || 0}</span>
                </div>
                <span className="bar-label">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWaterChart = () => {
    if (!weeklyWaterData.length) return null;

    const maxWater = Math.max(...weeklyWaterData.map(d => d.water_count || 0), 1);
    
    return (
      <div className="weekly-chart">
        <h3>Consumo de Agua - Últimos 7 días</h3>
        <div className="chart-bars">
          {weeklyWaterData.map((day, index) => {
            const height = ((day.water_count || 0) / maxWater) * 100;
            return (
              <div key={index} className="bar-container">
                <div 
                  className="bar" 
                  style={{ 
                    height: `${Math.max(height, 10)}%`,
                    backgroundColor: day.water_count > 8 ? '#06b6d4' : day.water_count > 5 ? '#0891b2' : day.water_count > 2 ? '#0e7490' : '#64748b'
                  }}
                >
                  <span className="bar-value">{day.water_count || 0}</span>
                </div>
                <span className="bar-label">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderExerciseChart = () => {
    if (!weeklyExerciseData.length) return null;

    const maxExercise = Math.max(...weeklyExerciseData.map(d => d.exercise_minutes || 0), 1);
    
    return (
      <div className="weekly-chart">
        <h3>Tiempo de Ejercicio - Últimos 7 días</h3>
        <div className="chart-bars">
          {weeklyExerciseData.map((day, index) => {
            const height = ((day.exercise_minutes || 0) / maxExercise) * 100;
            return (
              <div key={index} className="bar-container">
                <div 
                  className="bar" 
                  style={{ 
                    height: `${Math.max(height, 10)}%`,
                    backgroundColor: day.exercise_minutes > 60 ? '#10b981' : day.exercise_minutes > 30 ? '#059669' : day.exercise_minutes > 0 ? '#047857' : '#64748b'
                  }}
                >
                  <span className="bar-value">{day.exercise_minutes || 0}</span>
                </div>
                <span className="bar-label">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCombinedChart = () => {
    if (!combinedWeeklyData.length) return null;

    const colors = {
      food: '#fbbf24',
      water: '#06b6d4', 
      exercise: '#10b981',
      leisure: '#8b5cf6'
    };

    return (
      <div className="weekly-chart combined-chart">
        <h3>Actividades Registradas - Últimos 7 días</h3>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: colors.food }}></div>
            <span>Comidas</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: colors.water }}></div>
            <span>Hidratación</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: colors.exercise }}></div>
            <span>Ejercicio</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: colors.leisure }}></div>
            <span>Ocio</span>
          </div>
        </div>
        <div className="chart-bars combined-bars">
          {combinedWeeklyData.map((day, index) => {
            if (day.total === 0) {
              return (
                <div key={index} className="bar-container">
                  <div className="combined-bar" style={{ height: '20px', backgroundColor: '#e5e7eb' }}>
                    <span className="bar-value">0</span>
                  </div>
                  <span className="bar-label">{day.day}</span>
                </div>
              );
            }

            const foodPercent = (day.food / day.total) * 100;
            const waterPercent = (day.water / day.total) * 100;
            const exercisePercent = (day.exercise / day.total) * 100;
            const leisurePercent = (day.leisure / day.total) * 100;

            return (
              <div key={index} className="bar-container">
                <div className="combined-bar" style={{ height: '120px' }}>
                  {day.food > 0 && (
                    <div 
                      className="bar-segment" 
                      style={{ 
                        height: `${foodPercent}%`,
                        backgroundColor: colors.food
                      }}
                      title={`Comidas: ${day.food}`}
                    ></div>
                  )}
                  {day.water > 0 && (
                    <div 
                      className="bar-segment" 
                      style={{ 
                        height: `${waterPercent}%`,
                        backgroundColor: colors.water
                      }}
                      title={`Agua: ${day.water}`}
                    ></div>
                  )}
                  {day.exercise > 0 && (
                    <div 
                      className="bar-segment" 
                      style={{ 
                        height: `${exercisePercent}%`,
                        backgroundColor: colors.exercise
                      }}
                      title={`Ejercicio: ${day.exercise}`}
                    ></div>
                  )}
                  {day.leisure > 0 && (
                    <div 
                      className="bar-segment" 
                      style={{ 
                        height: `${leisurePercent}%`,
                        backgroundColor: colors.leisure
                      }}
                      title={`Ocio: ${day.leisure}`}
                    ></div>
                  )}
                  <span className="bar-value combined-value">{day.total}</span>
                </div>
                <span className="bar-label">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="charts-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando gráficos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="charts-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadChartsData} className="retry-btn">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="charts-container">
      <div className="charts-header">
        <h2>Análisis de Nutrición y Ejercicio</h2>
      </div>

      {/* Sección de Comidas */}
      <div className="section-header">
        <h3>Registro de Comidas por Momento</h3>
      </div>
      <div className="meal-counts-grid">
        {renderMealCountCard(
          nutritionData?.mealCounts?.breakfast || 0,
          'Desayuno',
          '🌅',
          '#ffd93d'
        )}
        {renderMealCountCard(
          nutritionData?.mealCounts?.snack_morning || 0,
          'Colación Mañana',
          '🍎',
          '#a7f3d0'
        )}
        {renderMealCountCard(
          nutritionData?.mealCounts?.lunch || 0,
          'Almuerzo',
          '🍽️',
          '#fbbf24'
        )}
        {renderMealCountCard(
          nutritionData?.mealCounts?.snack_afternoon || 0,
          'Colación Tarde',
          '🥨',
          '#c084fc'
        )}
        {renderMealCountCard(
          nutritionData?.mealCounts?.dinner || 0,
          'Cena',
          '🌙',
          '#60a5fa'
        )}
        {renderMealCountCard(
          nutritionData?.mealCounts?.snack_evening || 0,
          'Colación Noche',
          '🍪',
          '#f87171'
        )}
        {renderMealCountCard(
          nutritionData?.mealCounts?.water || 0,
          'Agua',
          '💧',
          '#06b6d4'
        )}
        {renderMealCountCard(
          nutritionData?.mealCounts?.other || 0,
          'Otros',
          '🍴',
          '#9ca3af'
        )}
      </div>

      {/* Sección de Ejercicios */}
      <div className="section-header">
        <h3>Estadísticas de Ejercicio</h3>
      </div>
      <div className="meal-counts-grid">
        {renderExerciseCard(
          exerciseData?.gym_sessions || 0,
          'Sesiones de Gimnasio',
          '🏋️',
          '#9f7aea',
          'sesiones'
        )}
        {renderExerciseCard(
          exerciseData?.cardio_minutes || 0,
          'Cardio',
          '🏃',
          '#f56565',
          'minutos'
        )}
        {renderExerciseCard(
          exerciseData?.strength_training_minutes || 0,
          'Entrenamiento de Fuerza',
          '💪',
          '#48bb78',
          'minutos'
        )}
        {renderExerciseCard(
          exerciseData?.total_minutes || 0,
          'Tiempo Total',
          '⏱️',
          '#ed8936',
          'minutos'
        )}
      </div>

      {/* Gráfico Combinado Semanal */}
      <div className="charts-grid">
        {renderCombinedChart()}
      </div>
      
      {/* Gráficos Individuales (opcional) */}
      <div className="charts-grid individual-charts" style={{ marginTop: '2rem' }}>
        {renderWeeklyChart()}
        {renderWaterChart()}
        {renderExerciseChart()}
      </div>
    </div>
  );
};

export default Charts;
import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './WeeklyChart.css';

const WeeklyChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    setLoading(true);
    try {
      // Obtener datos de las últimas 4 semanas
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28); // 4 semanas atrás

      // Cargar datos de alimentación
      const foodData = await apiService.getFoodEntries();
      const waterData = await apiService.getWaterEntries();
      const dailyStatsData = await apiService.getDailyStats();

      // Procesar datos por semana
      const weeklyStats = processWeeklyData(foodData, waterData, dailyStatsData, startDate);
      setWeeklyData(weeklyStats);
    } catch (error) {
      console.error('Error loading weekly data:', error);
      setError('Error al cargar los datos semanales');
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyData = (foodData, waterData, dailyStatsData, startDate) => {
    const weeks = [];
    const currentDate = new Date(startDate);

    // Generar 4 semanas
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekData = {
        week: `Semana ${i + 1}`,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        food: 0,
        water: 0,
        exercise: 0,
        leisure: 0
      };

      // Contar registros de comida en esta semana
      weekData.food = foodData.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= weekStart && itemDate <= weekEnd;
      }).length;

      // Contar registros de agua en esta semana
      weekData.water = waterData.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= weekStart && itemDate <= weekEnd;
      }).length;

      // Contar registros de ejercicio y ocio en esta semana
      dailyStatsData.forEach(stat => {
        const statDate = new Date(stat.date);
        if (statDate >= weekStart && statDate <= weekEnd) {
          const activityMetrics = stat.activity_metrics || {};
          
          // Contar ejercicios (si tiene alguna actividad física)
          if (activityMetrics.gym_sessions > 0 || activityMetrics.cardio_minutes > 0 || activityMetrics.strength_training_minutes > 0) {
            weekData.exercise++;
          }
          
          // Contar actividades de tiempo (si tiene alguna actividad de tiempo)
          if (activityMetrics.work_minutes > 0 || activityMetrics.leisure_minutes > 0 || 
              activityMetrics.rest_minutes > 0 || activityMetrics.study_minutes > 0 || 
              activityMetrics.social_minutes > 0) {
            weekData.leisure++;
          }
        }
      });

      weeks.push(weekData);
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return weeks;
  };

  const getMaxValue = () => {
    if (weeklyData.length === 0) return 100;
    return Math.max(...weeklyData.map(week => week.food + week.water + week.exercise + week.leisure)) || 100;
  };

  const getPercentage = (value, total) => {
    if (total === 0) return 0;
    return (value / total) * 100;
  };

  if (loading) {
    return (
      <div className="weekly-chart">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando datos semanales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weekly-chart">
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button onClick={loadWeeklyData}>Reintentar</button>
        </div>
      </div>
    );
  }

  const maxValue = getMaxValue();

  return (
    <div className="weekly-chart">
      <div className="chart-header">
        <h3>📊 Registros Semanales</h3>
        <p>Cantidad de ítemes registrados por categoría en las últimas 4 semanas</p>
      </div>

      <div className="chart-container">
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color food"></div>
            <span>Alimentación</span>
          </div>
          <div className="legend-item">
            <div className="legend-color water"></div>
            <span>Hidratación</span>
          </div>
          <div className="legend-item">
            <div className="legend-color exercise"></div>
            <span>Ejercicio</span>
          </div>
          <div className="legend-item">
            <div className="legend-color leisure"></div>
            <span>Actividades</span>
          </div>
        </div>

        <div className="chart-bars">
          {weeklyData.map((week, index) => {
            const total = week.food + week.water + week.exercise + week.leisure;
            const height = total > 0 ? (total / maxValue) * 300 : 10; // Altura mínima de 10px

            return (
              <div key={index} className="bar-container">
                <div className="bar" style={{ height: `${height}px` }}>
                  {total > 0 && (
                    <>
                      {week.food > 0 && (
                        <div 
                          className="bar-segment food" 
                          style={{ height: `${getPercentage(week.food, total)}%` }}
                          title={`Alimentación: ${week.food} registros`}
                        ></div>
                      )}
                      {week.water > 0 && (
                        <div 
                          className="bar-segment water" 
                          style={{ height: `${getPercentage(week.water, total)}%` }}
                          title={`Hidratación: ${week.water} registros`}
                        ></div>
                      )}
                      {week.exercise > 0 && (
                        <div 
                          className="bar-segment exercise" 
                          style={{ height: `${getPercentage(week.exercise, total)}%` }}
                          title={`Ejercicio: ${week.exercise} registros`}
                        ></div>
                      )}
                      {week.leisure > 0 && (
                        <div 
                          className="bar-segment leisure" 
                          style={{ height: `${getPercentage(week.leisure, total)}%` }}
                          title={`Actividades: ${week.leisure} registros`}
                        ></div>
                      )}
                    </>
                  )}
                </div>
                <div className="bar-label">
                  <div className="week-name">{week.week}</div>
                  <div className="week-total">{total} registros</div>
                  <div className="week-dates">
                    {new Date(week.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - 
                    {new Date(week.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="chart-summary">
          <div className="summary-stats">
            {weeklyData.map((week, index) => {
              const total = week.food + week.water + week.exercise + week.leisure;
              return (
                <div key={index} className="week-summary">
                  <h4>{week.week}</h4>
                  <div className="summary-details">
                    <div className="detail-item">
                      <span className="detail-icon">🍽️</span>
                      <span>{week.food}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">💧</span>
                      <span>{week.water}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">🏋️</span>
                      <span>{week.exercise}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">🎮</span>
                      <span>{week.leisure}</span>
                    </div>
                  </div>
                  <div className="week-total-summary">Total: {total}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyChart;
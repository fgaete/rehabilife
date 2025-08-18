import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api';
import './EditProfile.css';

const EditProfile = ({ onClose, onSave }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    profile: {
      age: '',
      weight: '',
      height: '',
      activity_level: 'moderate',
      goal: 'health',
      target_weight: '',
      gym_days_per_week: 3,
      medical_conditions: [],
      allergies: []
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        profile: {
          age: user.profile?.age || '',
          weight: user.profile?.weight || '',
          height: user.profile?.height || '',
          activity_level: user.profile?.activity_level || 'moderate',
          goal: user.profile?.goal || 'health',
          target_weight: user.profile?.target_weight || '',
          gym_days_per_week: user.profile?.gym_days_per_week || 3,
          medical_conditions: user.profile?.medical_conditions || [],
          allergies: user.profile?.allergies || []
        }
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'full_name') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [name]: value
        }
      }));
    }
  };

  const handleArrayChange = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: items
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Preparar datos para enviar
      const updateData = {
        full_name: formData.full_name,
        profile: {
          ...formData.profile,
          age: formData.profile.age ? parseInt(formData.profile.age) : null,
          weight: formData.profile.weight ? parseFloat(formData.profile.weight) : null,
          height: formData.profile.height ? parseFloat(formData.profile.height) : null,
          target_weight: formData.profile.target_weight ? parseFloat(formData.profile.target_weight) : null,
          gym_days_per_week: parseInt(formData.profile.gym_days_per_week)
        }
      };

      const updatedUser = await apiService.updateUserProfile(updateData);
      updateUser(updatedUser);
      setSuccess(true);
      
      if (onSave) {
        onSave(updatedUser);
      }

      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1500);

    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentario (poco o ningún ejercicio)' },
    { value: 'light', label: 'Ligero (ejercicio ligero 1-3 días/semana)' },
    { value: 'moderate', label: 'Moderado (ejercicio moderado 3-5 días/semana)' },
    { value: 'active', label: 'Activo (ejercicio intenso 6-7 días/semana)' },
    { value: 'very_active', label: 'Muy activo (ejercicio muy intenso, trabajo físico)' }
  ];

  const goals = [
    { value: 'weight_loss', label: 'Perder peso' },
    { value: 'weight_gain', label: 'Ganar peso' },
    { value: 'maintain', label: 'Mantener peso' },
    { value: 'muscle_gain', label: 'Ganar músculo' },
    { value: 'health', label: 'Mejorar salud general' }
  ];

  return (
    <div className="edit-profile-overlay">
      <div className="edit-profile-modal">
        <div className="modal-header">
          <h2>Editar Perfil</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              ¡Perfil actualizado exitosamente!
            </div>
          )}

          <div className="form-section">
            <h3>Información Personal</h3>
            
            <div className="form-group">
              <label htmlFor="full_name">Nombre Completo</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Edad</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.profile.age}
                  onChange={handleInputChange}
                  placeholder="Años"
                  min="1"
                  max="120"
                />
              </div>

              <div className="form-group">
                <label htmlFor="weight">Peso (kg)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.profile.weight}
                  onChange={handleInputChange}
                  placeholder="Peso en kg"
                  min="1"
                  max="500"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="height">Altura (cm)</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.profile.height}
                  onChange={handleInputChange}
                  placeholder="Altura en cm"
                  min="50"
                  max="250"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Objetivos y Actividad</h3>
            
            <div className="form-group">
              <label htmlFor="goal">Objetivo Principal</label>
              <select
                id="goal"
                name="goal"
                value={formData.profile.goal}
                onChange={handleInputChange}
              >
                {goals.map(goal => (
                  <option key={goal.value} value={goal.value}>
                    {goal.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="activity_level">Nivel de Actividad</label>
              <select
                id="activity_level"
                name="activity_level"
                value={formData.profile.activity_level}
                onChange={handleInputChange}
              >
                {activityLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="target_weight">Peso Objetivo (kg)</label>
                <input
                  type="number"
                  id="target_weight"
                  name="target_weight"
                  value={formData.profile.target_weight}
                  onChange={handleInputChange}
                  placeholder="Peso objetivo"
                  min="1"
                  max="500"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gym_days_per_week">Días de Gimnasio por Semana</label>
                <input
                  type="number"
                  id="gym_days_per_week"
                  name="gym_days_per_week"
                  value={formData.profile.gym_days_per_week}
                  onChange={handleInputChange}
                  min="0"
                  max="7"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Información Médica</h3>
            
            <div className="form-group">
              <label htmlFor="medical_conditions">Condiciones Médicas</label>
              <input
                type="text"
                id="medical_conditions"
                value={formData.profile.medical_conditions.join(', ')}
                onChange={(e) => handleArrayChange('medical_conditions', e.target.value)}
                placeholder="Separar con comas (ej: diabetes, hipertensión)"
              />
              <small>Opcional: Ingresa condiciones médicas relevantes separadas por comas</small>
            </div>

            <div className="form-group">
              <label htmlFor="allergies">Alergias</label>
              <input
                type="text"
                id="allergies"
                value={formData.profile.allergies.join(', ')}
                onChange={(e) => handleArrayChange('allergies', e.target.value)}
                placeholder="Separar con comas (ej: nueces, mariscos)"
              />
              <small>Opcional: Ingresa alergias alimentarias separadas por comas</small>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="save-button" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
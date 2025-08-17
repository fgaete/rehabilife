import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

const Register = ({ onSwitchToLogin }) => {
  const { register, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    age: '',
    weight: '',
    height: '',
    activity_level: 'moderate',
    goal: 'maintain'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Datos básicos, 2: Perfil de salud

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) clearError();
  };

  const validateStep1 = () => {
    return formData.email && 
           formData.username && 
           formData.password && 
           formData.confirmPassword &&
           formData.password === formData.confirmPassword &&
           formData.password.length >= 6;
  };

  const validateStep2 = () => {
    return formData.full_name &&
           formData.age &&
           formData.weight &&
           formData.height &&
           parseInt(formData.age) > 0 &&
           parseFloat(formData.weight) > 0 &&
           parseFloat(formData.height) > 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    // Preparar datos para el registro
    const registrationData = {
      email: formData.email,
      username: formData.username,
      password: formData.password,
      profile: {
        full_name: formData.full_name,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        activity_level: formData.activity_level,
        goal: formData.goal
      }
    };

    const result = await register(registrationData);
    
    if (result.success) {
      console.log('Registro exitoso:', result.user);
    }
  };

  const renderStep1 = () => (
    <>
      <div className="form-group">
        <label htmlFor="email">Correo Electrónico</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="tu@email.com"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="username">Nombre de Usuario</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="tu_usuario"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Contraseña</label>
        <div className="password-input">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Mínimo 6 caracteres"
            required
            disabled={loading}
            minLength={6}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
        <div className="password-input">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Repite tu contraseña"
            required
            disabled={loading}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={loading}
          >
            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <small className="error-text">Las contraseñas no coinciden</small>
        )}
      </div>

      <button
        type="button"
        className="auth-button"
        onClick={handleNextStep}
        disabled={!validateStep1() || loading}
      >
        Siguiente
      </button>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="form-group">
        <label htmlFor="full_name">Nombre Completo</label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          placeholder="Tu nombre completo"
          required
          disabled={loading}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="age">Edad</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="25"
            min="1"
            max="120"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="weight">Peso (kg)</label>
          <input
            type="number"
            id="weight"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            placeholder="70"
            min="1"
            step="0.1"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="height">Altura (cm)</label>
        <input
          type="number"
          id="height"
          name="height"
          value={formData.height}
          onChange={handleChange}
          placeholder="170"
          min="1"
          max="300"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="activity_level">Nivel de Actividad</label>
        <select
          id="activity_level"
          name="activity_level"
          value={formData.activity_level}
          onChange={handleChange}
          required
          disabled={loading}
        >
          <option value="sedentary">Sedentario (poco o ningún ejercicio)</option>
          <option value="light">Ligero (ejercicio ligero 1-3 días/semana)</option>
          <option value="moderate">Moderado (ejercicio moderado 3-5 días/semana)</option>
          <option value="active">Activo (ejercicio intenso 6-7 días/semana)</option>
          <option value="very_active">Muy activo (ejercicio muy intenso, trabajo físico)</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="goal">Objetivo</label>
        <select
          id="goal"
          name="goal"
          value={formData.goal}
          onChange={handleChange}
          required
          disabled={loading}
        >
          <option value="lose_weight">Perder peso</option>
          <option value="maintain">Mantener peso</option>
          <option value="gain_weight">Ganar peso</option>
          <option value="build_muscle">Ganar músculo</option>
        </select>
      </div>

      <div className="form-buttons">
        <button
          type="button"
          className="auth-button secondary"
          onClick={handlePrevStep}
          disabled={loading}
        >
          Anterior
        </button>
        
        <button
          type="submit"
          className="auth-button"
          disabled={!validateStep2() || loading}
        >
          {loading ? 'Registrando...' : 'Crear Cuenta'}
        </button>
      </div>
    </>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Crear Cuenta</h2>
          <p>Únete a RehabiLife y comienza tu viaje hacia una vida más saludable</p>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {step === 1 ? renderStep1() : renderStep2()}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </form>

        <div className="auth-footer">
          <p>
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
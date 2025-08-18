import React, { createContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar si hay un usuario autenticado al cargar la aplicación
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = apiService.getToken();
        if (token) {
          // Verificar si el token es válido obteniendo los datos del usuario
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        // Si hay error, limpiar datos de autenticación
        apiService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Función para registrar usuario
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.register(userData);
      setUser(response.user);
      
      return { success: true, user: response.user };
    } catch (error) {
      const errorMessage = error?.message || error?.detail || (typeof error === 'string' ? error : 'Error al registrar usuario');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Función para iniciar sesión
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.login(credentials);
      
      // Obtener datos completos del usuario
      const userData = await apiService.getCurrentUser();
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      const errorMessage = error?.message || error?.detail || (typeof error === 'string' ? error : 'Error al iniciar sesión');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    apiService.logout();
    setUser(null);
    setError(null);
  };

  // Función para actualizar perfil de usuario
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await apiService.updateUserProfile(profileData);
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = error?.message || error?.detail || (typeof error === 'string' ? error : 'Error al actualizar perfil');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar datos del usuario
  const refreshUser = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error al refrescar usuario:', error);
      // Si hay error, posiblemente el token expiró
      logout();
      throw error;
    }
  };

  // Limpiar errores
  const clearError = () => {
    setError(null);
  };

  // Alias para updateProfile para mantener consistencia
  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateProfile,
    updateUser,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
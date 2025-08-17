// Servicio de API para comunicarse con el backend FastAPI

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('access_token');
  }

  // Configurar headers por defecto
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Manejar respuestas de la API
  async handleResponse(response) {
    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado o inválido
        this.logout();
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  // Realizar petición HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.includeAuth !== false),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'}] ${endpoint}:`, error);
      throw error;
    }
  }

  // Métodos HTTP
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Autenticación
  setToken(token) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  getToken() {
    return this.token || localStorage.getItem('access_token');
  }

  logout() {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  // === ENDPOINTS DE AUTENTICACIÓN ===
  
  async register(userData) {
    const response = await this.post('/api/auth/register', userData, { includeAuth: false });
    if (response.access_token) {
      this.setToken(response.access_token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }
    return response;
  }

  async login(credentials) {
    // FastAPI espera form data para OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      body: formData,
    });

    const data = await this.handleResponse(response);
    
    if (data.access_token) {
      this.setToken(data.access_token);
      // Obtener datos del usuario
      const userData = await this.getCurrentUser();
      localStorage.setItem('user_data', JSON.stringify(userData));
    }
    
    return data;
  }

  async getCurrentUser() {
    return this.get('/api/auth/me');
  }

  // === ENDPOINTS DE USUARIOS ===
  
  async getUserProfile() {
    return this.get('/api/users/profile');
  }

  async updateUserProfile(profileData) {
    return this.put('/api/users/profile', profileData);
  }

  async getUserStats() {
    return this.get('/api/users/stats');
  }

  // === ENDPOINTS DE NUTRICIÓN ===
  
  async addFoodEntry(foodData) {
    return this.post('/api/nutrition/food', foodData);
  }

  async addWaterEntry(waterData) {
    return this.post('/api/nutrition/water', waterData);
  }

  async getNutritionEntries(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/nutrition/entries${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint);
  }

  async getDailySummary(date = null) {
    const params = date ? `?date=${date}` : '';
    return this.get(`/nutrition/daily-summary${params}`);
  }

  async getNutritionAdvice(date = null) {
    const params = date ? `?date=${date}` : '';
    return this.get(`/nutrition/advice${params}`);
  }

  async deleteNutritionEntry(entryId, entryType) {
    return this.delete(`/nutrition/${entryType}/${entryId}`);
  }

  async getNutritionGoals() {
    return this.get('/api/nutrition/goals');
  }

  // === ENDPOINTS DE ANALYTICS ===
  
  async getAnalyticsSummary(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/analytics/summary${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint);
  }

  async getDailyStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/analytics/daily-stats${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint);
  }

  async createDailyStats(statsData) {
    return this.post('/api/analytics/daily-stats', statsData);
  }

  async updateDailyStats(statsId, statsData) {
    return this.put(`/api/analytics/daily-stats/${statsId}`, statsData);
  }

  async getGoalsProgress() {
    return this.get('/api/analytics/goals-progress');
  }

  // === ENDPOINTS DE NOTIFICACIONES ===
  
  async getNotificationSettings() {
    return this.get('/api/notifications/settings');
  }

  async updateNotificationSettings(settings) {
    return this.put('/api/notifications/settings', settings);
  }

  async sendNotification(notificationData) {
    return this.post('/api/notifications/send', notificationData);
  }

  async getNotificationHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/notifications/history${queryString ? `?${queryString}` : ''}`;
    return this.get(endpoint);
  }

  async getSmartReminders() {
    return this.get('/api/notifications/smart-reminders');
  }

  async testReminder(reminderType) {
    return this.post(`/api/notifications/test-reminder/${reminderType}`);
  }

  async scheduleReminders() {
    return this.post('/api/notifications/schedule-reminders');
  }

  async clearNotificationHistory() {
    return this.delete('/api/notifications/clear-history');
  }
}

// Instancia singleton del servicio de API
const apiService = new ApiService();

export default apiService;

// Exportar también la clase para casos especiales
export { ApiService };
// ============================================
// FICHIER : frontend/src/services/api.js
// ============================================

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API d'authentification
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),


  logout: () =>
    api.post('/auth/logout'),

  changePassword: (currentPassword, newPassword, confirmPassword) =>
    api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    })
}

// API des joueurs
export const playersAPI = {
  getAll: (params = {}) =>
    api.get('/players', { params }),

  getById: (id) =>
    api.get(`/players/${id}`),

  create: (playerData) =>
    api.post('/players', playerData),

  update: (id, playerData) =>
    api.put(`/players/${id}`, playerData),

  delete: (id) =>
    api.delete(`/players/${id}`)
}

// API des équipes
export const teamsAPI = {
  getAll: (params = {}) =>
    api.get('/teams', { params }),

  getById: (id) =>
    api.get(`/teams/${id}`),

  create: (teamData) =>
    api.post('/teams', teamData),

  update: (id, teamData) =>
    api.put(`/teams/${id}`, teamData),

  delete: (id) =>
    api.delete(`/teams/${id}`)
}

// API des événements
export const eventsAPI = {
  getAll: (params = {}) =>
    api.get('/events', { params }),

  getById: (id) =>
    api.get(`/events/${id}`),

  create: (eventData) =>
    api.post('/events', eventData),

  update: (id, eventData) =>
    api.put(`/events/${id}`, eventData),

  delete: (id) =>
    api.delete(`/events/${id}`)
}

// API des matchs
export const matchesAPI = {
  getAll: (params = {}) =>
    api.get('/matches', { params }),

  getById: (id) =>
    api.get(`/matches/${id}`),

  create: (matchData) =>
    api.post('/matches', matchData),

  update: (id, matchData) =>
    api.put(`/matches/${id}`, matchData),

  delete: (id) =>
    api.delete(`/matches/${id}`)
}

// API des pools
export const poolsAPI = {
  getAll: (params = {}) =>
    api.get('/pools', { params }),

  getById: (id) =>
    api.get(`/pools/${id}`),

  create: (poolData) =>
    api.post('/pools', poolData),

  update: (id, poolData) =>
    api.put(`/pools/${id}`, poolData),

  delete: (id) =>
    api.delete(`/pools/${id}`)
}

// API des résultats
export const resultsAPI = {
  getAll: (params = {}) =>
    api.get('/results', { params }),

  getById: (id) =>
    api.get(`/results/${id}`),

  create: (resultData) =>
    api.post('/results', resultData),

  update: (id, resultData) =>
    api.put(`/results/${id}`, resultData),

  delete: (id) =>
    api.delete(`/results/${id}`)
}

// API du profil utilisateur
export const profileAPI = {
  get: () =>
    api.get('/profile'),

  update: (profileData) =>
    api.put('/profile', profileData)
}

export default api
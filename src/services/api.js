// services/api.js
// Axios instance and interceptors that are shared by all service modules.
// Centralising the base URL and auth header logic here means that every API
// call automatically carries the JWT token without repeating the header setup
// in each service file.  The 401 interceptor redirects users to the login page
// if their session has expired or the token has been revoked.

import axios from 'axios'

// Base URL for all backend API calls
// In production, VITE_API_URL is set during the CI/CD build step.
// In development, it falls back to the local Spring Boot server port.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001/api'

// Create a shared Axios instance so interceptors apply to every request
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 10-second timeout prevents requests hanging indefinitely
  timeout: 10000,
})

// ---------------------------------------------------------------------------
// Request interceptor - attaches the JWT token from localStorage
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    // Retrieve the token that was stored at login time
    const token = localStorage.getItem('token')
    if (token) {
      // Bearer token scheme as expected by the Spring Security backend
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // Pass request setup errors straight through to the caller
    return Promise.reject(error)
  }
)

// ---------------------------------------------------------------------------
// Response interceptor - handles common HTTP error cases
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  // Happy path: just return the response unchanged
  (response) => response,
  (error) => {
    if (error.response) {
      // 401 Unauthorized means the token is missing, expired, or invalid.
      // Clear the stale token and redirect so the user can log in again.
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Use window.location to navigate outside React Router context
        window.location.href = '/login'
      }

      // 403 Forbidden - user lacks permission; let the component decide how to handle it
      // 404, 500, etc. are also passed through to the calling service
    }
    return Promise.reject(error)
  }
)

export default api

// context/AuthContext.jsx
// Provides application-wide authentication state via React Context.
// The AuthProvider component persists the JWT token in localStorage so that
// the session survives page refreshes.  It also decodes the token payload to
// expose basic user info (username, userId) without making an extra API call.
// All child components can call useAuth() to access the current user or trigger
// login / register / logout actions.
//
// Note: This file intentionally exports both a provider component (AuthProvider)
// and a custom hook (useAuth) from the same module for cohesion.

import { createContext, useContext, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

// The shape of the context value
const AuthContext = createContext(null)

/**
 * Lightweight base64url decoder for reading JWT payloads.
 * We only need the sub, userId, and username claims - we don't verify the
 * signature here since the backend validates it on every API call.
 *
 * @param {string} token - Raw JWT string
 * @returns {object|null} Parsed payload or null if decoding fails
 */
function decodeToken(token) {
  try {
    // JWT structure: header.payload.signature - we only need the middle section
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    // atob decodes base64; decodeURIComponent handles Unicode characters
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (_e) {
    // Token is malformed or empty - treat as unauthenticated
    return null
  }
}

/**
 * Reads the persisted token from localStorage and derives a user object.
 * Called once on mount to rehydrate the session after a page refresh.
 */
function loadUserFromStorage() {
  const token = localStorage.getItem('token')
  if (!token) return null

  const payload = decodeToken(token)
  if (!payload) return null

  // Check if the token has expired (exp is Unix timestamp in seconds)
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return null
  }

  return {
    id: payload.userId || payload.sub,
    username: payload.sub || payload.username,
    email: payload.email || '',
    fullName: payload.fullName || '',
    token,
  }
}

// ---------------------------------------------------------------------------
// AuthProvider
// ---------------------------------------------------------------------------

/**
 * Wraps the component tree and provides auth state + actions to all children.
 */
export function AuthProvider({ children }) {
  // Initialise from localStorage so refresh doesn't log the user out
  const [user, setUser] = useState(() => loadUserFromStorage())

  // navigate is available because AuthProvider is inside BrowserRouter
  const navigate = useNavigate()

  /**
   * Authenticate a user with username + password.
   * Stores the returned JWT and decodes it to populate the user state.
   *
   * @param {{ username: string, password: string }} credentials
   * @returns {Promise<void>}
   * @throws {Error} On invalid credentials (HTTP 401) or network errors
   */
  const login = useCallback(async (credentials) => {
    // POST to the backend auth endpoint
    const response = await api.post('/auth/login', credentials)
    const { token } = response.data

    // Persist token for future page loads and interceptor use
    localStorage.setItem('token', token)

    // Derive user info from the JWT payload
    const payload = decodeToken(token)
    const loggedInUser = {
      id: payload?.userId || payload?.sub,
      username: payload?.sub || payload?.username,
      email: payload?.email || '',
      fullName: payload?.fullName || '',
      token,
    }

    localStorage.setItem('user', JSON.stringify(loggedInUser))
    setUser(loggedInUser)
  }, [])

  /**
   * Register a new account.  On success, automatically logs the user in.
   *
   * @param {{ username: string, email: string, password: string, fullName: string }} userData
   * @returns {Promise<void>}
   */
  const register = useCallback(async (userData) => {
    await api.post('/auth/register', userData)
    // After registration, log in immediately to obtain the JWT
    await login({ username: userData.username, password: userData.password })
  }, [login])

  /**
   * Clear the session and redirect the user to the login page.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }, [navigate])

  const value = {
    user,         // The current user object, or null if unauthenticated
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook for consuming the auth context.
 * Throws a descriptive error if used outside an AuthProvider.
 * The eslint-disable below allows co-locating the hook with its provider
 * in one file, which is the recommended pattern for React Context modules.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return ctx
}

export default AuthContext

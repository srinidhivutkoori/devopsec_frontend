// components/Auth/ProtectedRoute.jsx
// Higher-order route component that guards pages requiring authentication.
// If the user is not logged in, they are redirected to /login.
// The `replace` prop prevents the login page from being added to the
// browser history so hitting the back button works as expected.

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * ProtectedRoute
 * Renders its children only when the user is authenticated.
 * Otherwise redirects to the login page.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The page/component to protect
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    // Replace the current history entry so the back button goes to the
    // page before the login redirect, not back to the protected page.
    return <Navigate to="/login" replace />
  }

  return children
}

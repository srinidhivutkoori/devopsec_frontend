// App.jsx
// Root application component.
// Sets up React Router with all application routes:
//   - Public routes: /login, /register (no auth required)
//   - Protected routes: /dashboard, /boards, /boards/:id, /teams,
//     /boards/:id/permissions, /boards/:id/snapshots, /analytics
// ProtectedRoute guards authenticated pages - unauthenticated users are
// redirected to /login.
// AuthProvider wraps everything so all child components can access the
// current user and auth actions via the useAuth() hook.
// ToastContainer must be rendered once at the top level so toast() calls
// from any component show notifications.

import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'

import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import MainLayout from './components/Layout/MainLayout'

// Auth pages
import LoginForm    from './components/Auth/LoginForm'
import RegisterForm from './components/Auth/RegisterForm'

// App pages
import Dashboard        from './components/Dashboard/Dashboard'
import BoardList        from './components/Boards/BoardList'
import WhiteboardCanvas from './components/Boards/WhiteboardCanvas'
import TeamList         from './components/Teams/TeamList'
import PermissionList   from './components/Permissions/PermissionList'
import SnapshotList     from './components/Snapshots/SnapshotList'
import ActivityFeed     from './components/Activity/ActivityFeed'

import './App.css'

/**
 * App
 * Root router component.  AuthProvider must be inside BrowserRouter (provided
 * in main.jsx) so that the useNavigate() call inside AuthContext works correctly.
 */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ------------------------------------------------------------------ */}
        {/* Public routes - accessible without authentication                  */}
        {/* ------------------------------------------------------------------ */}
        <Route path="/login"    element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        {/* ------------------------------------------------------------------ */}
        {/* Protected routes - wrapped in MainLayout (Navbar + Sidebar)        */}
        {/* ------------------------------------------------------------------ */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard overview */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Board list and CRUD */}
          <Route path="/boards" element={<BoardList />} />

          {/* Whiteboard canvas - full drawing interface */}
          {/* Note: this page overrides the MainLayout padding via -m-6 */}
          <Route path="/boards/:id" element={<WhiteboardCanvas />} />

          {/* Board permission management */}
          <Route path="/boards/:id/permissions" element={<PermissionList />} />

          {/* Version history / snapshot replay */}
          <Route path="/boards/:id/snapshots" element={<SnapshotList />} />

          {/* Team management */}
          <Route path="/teams" element={<TeamList />} />

          {/* Activity feed */}
          <Route path="/activity" element={<ActivityFeed />} />
        </Route>

        {/* ------------------------------------------------------------------ */}
        {/* Fallback: redirect root and unknown paths to /dashboard or /login  */}
        {/* ------------------------------------------------------------------ */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Minimal toast notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar
        newestOnTop
        closeOnClick
        limit={2}
        theme="light"
      />
    </AuthProvider>
  )
}

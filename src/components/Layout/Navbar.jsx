// components/Layout/Navbar.jsx
// Top navigation bar displayed on all authenticated pages.
// Contains the application title, main navigation links, and a user
// info / logout section on the right side.
// Links are highlighted with NavLink so the active route is visually indicated.

import { NavLink } from 'react-router-dom'
import {
  FiGrid,
  FiLayout,
  FiUsers,
  FiBarChart2,
  FiLogOut,
  FiUser,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

// Navigation items shared between Navbar and Sidebar
const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/boards',    label: 'Boards',    icon: FiLayout },
  { to: '/teams',     label: 'Teams',     icon: FiUsers },
  { to: '/activity',  label: 'Activity',  icon: FiBarChart2 },
]

/**
 * Navbar
 * Fixed top navigation bar with route links and logout control.
 */
export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <nav className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Application brand / logo */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <FiLayout className="text-white" size={14} />
          </div>
          <span className="font-bold text-slate-800 text-sm hidden sm:block">
            Whiteboard
          </span>
        </div>

        {/* Main navigation links - grow to fill remaining space */}
        <div className="flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={15} />
              {/* Hide label text on very small screens to save space */}
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* User info and logout - right-aligned */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Display the current user's username */}
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <FiUser size={15} className="text-slate-400" />
            <span className="hidden md:inline">{user?.username}</span>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            title="Sign out"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600
              rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <FiLogOut size={15} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </nav>
    </header>
  )
}

// components/Layout/Sidebar.jsx
// Optional side navigation panel.
// On larger screens this renders as a persistent left sidebar with links.
// On mobile it collapses and is toggled by the Navbar menu button.
// Currently rendered inside MainLayout alongside Navbar; can be hidden
// by setting the `isOpen` prop to false.

import { NavLink } from 'react-router-dom'
import {
  FiGrid,
  FiLayout,
  FiUsers,
  FiBarChart2,
} from 'react-icons/fi'

// Sidebar navigation items - mirrors top nav but can include extra admin links
const SIDEBAR_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/boards',    label: 'Boards',    icon: FiLayout },
  { to: '/teams',     label: 'Teams',     icon: FiUsers },
  { to: '/activity',  label: 'Activity',  icon: FiBarChart2 },
]

/**
 * Sidebar
 * Left-hand navigation panel.
 *
 * @param {object}  props
 * @param {boolean} [props.isOpen=true] - Whether the sidebar is visible
 */
export default function Sidebar({ isOpen = true }) {
  if (!isOpen) return null

  return (
    // Fixed-width sidebar visible on medium screens and above
    <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-200 min-h-full pt-4 pb-8">
      {/* Section heading */}
      <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Navigation
      </p>

      {/* Navigation link list */}
      <nav className="flex flex-col gap-0.5 px-2">
        {SIDEBAR_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

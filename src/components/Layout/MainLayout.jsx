// components/Layout/MainLayout.jsx
// Shared page wrapper used by all authenticated routes.
// Renders the sticky Navbar at the top, an optional Sidebar on the left,
// and the main content area that fills the remaining space.
// The Outlet from React Router is placed inside the content area so child
// routes are rendered there automatically.

import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

/**
 * MainLayout
 * Full-page layout wrapper for authenticated screens.
 * Uses a flex column arrangement: Navbar on top, then a flex row
 * containing the optional Sidebar and the main Outlet area.
 */
export default function MainLayout() {
  return (
    // Full viewport height flex column
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Sticky top navigation bar */}
      <Navbar />

      {/* Below-navbar row: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - hidden on mobile, visible on md+ */}
        <Sidebar />

        {/* Main scrollable content area where child routes render */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* React Router renders the matched child route here */}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

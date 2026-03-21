import { useState } from 'react'
import { FiUser, FiMail, FiLogOut } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

/**
 * SettingsPage — user profile and preferences.
 */
export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [confirmLogout, setConfirmLogout] = useState(false)

  return (
    <div className="max-w-screen-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Profile</p>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
            {(user?.username || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <FiUser size={14} className="text-slate-400" />
              <span className="font-medium">{user?.username || 'Unknown'}</span>
            </div>
            {user?.email && (
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <FiMail size={14} className="text-slate-400" />
                {user.email}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Account</p>

        {!confirmLogout ? (
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <FiLogOut size={15} /> Sign Out
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-600">Are you sure?</p>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Yes, sign out
            </button>
            <button
              onClick={() => setConfirmLogout(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

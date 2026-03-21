// components/Permissions/PermissionForm.jsx
// Modal form for granting a new permission on a board.
// Supports autocomplete search for both users and teams.

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { FiX } from 'react-icons/fi'
import { permissionSchema } from '../../utils/validators'
import { getAllTeams } from '../../services/teamService'
import api from '../../services/api'

const LEVELS = ['VIEW', 'EDIT', 'ADMIN']

export default function PermissionForm({ permission, onSubmit, onClose, isSubmitting = false }) {
  const [targetType, setTargetType] = useState(permission?.team ? 'team' : 'user')
  const [teams, setTeams] = useState([])
  const [targetError, setTargetError] = useState(null)
  const [username, setUsername] = useState(permission?.user?.username || '')
  const [teamId, setTeamId] = useState(permission?.team?.id || '')

  // User autocomplete state
  const [userSuggestions, setUserSuggestions] = useState([])
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)
  const userSearchTimer = useRef(null)

  // Team autocomplete state
  const [teamQuery, setTeamQuery] = useState(permission?.team?.name || '')
  const [filteredTeams, setFilteredTeams] = useState([])
  const [showTeamSuggestions, setShowTeamSuggestions] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(permissionSchema),
    mode: 'onChange',
    defaultValues: { permissionLevel: permission?.permissionLevel ?? 'VIEW' },
  })

  useEffect(() => {
    getAllTeams().then(setTeams).catch(() => {})
  }, [])

  // Debounced user search
  const handleUsernameInput = (value) => {
    setUsername(value)
    setTargetError(null)
    if (userSearchTimer.current) clearTimeout(userSearchTimer.current)
    if (value.trim().length < 1) {
      setUserSuggestions([])
      setShowUserSuggestions(false)
      return
    }
    userSearchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get('/auth/users/search', { params: { q: value.trim() } })
        setUserSuggestions(res.data || [])
        setShowUserSuggestions(true)
      } catch (_e) {
        setUserSuggestions([])
      }
    }, 250)
  }

  // Filter teams locally as user types
  const handleTeamInput = (value) => {
    setTeamQuery(value)
    setTeamId('')
    setTargetError(null)
    if (value.trim().length < 1) {
      setFilteredTeams([])
      setShowTeamSuggestions(false)
      return
    }
    const matches = teams.filter((t) =>
      t.name.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredTeams(matches)
    setShowTeamSuggestions(true)
  }

  const handleFormSubmit = (data) => {
    if (targetType === 'user' && !username.trim()) {
      setTargetError('Username is required')
      return
    }
    if (targetType === 'team' && !teamId) {
      setTargetError('Please select a team from the suggestions')
      return
    }
    setTargetError(null)

    const payload = { ...data }
    if (targetType === 'user') {
      payload.username = username.trim()
    } else {
      payload.teamId = parseInt(teamId)
    }
    onSubmit(payload)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800">
            {permission ? 'Edit Permission' : 'Grant Permission'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          {/* Target type selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Grant permission to
            </label>
            <div className="flex gap-2">
              {['user', 'team'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTargetType(t); setTargetError(null) }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    targetType === t
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t === 'user' ? 'User' : 'Team'}
                </button>
              ))}
            </div>
          </div>

          {/* User input with autocomplete */}
          {targetType === 'user' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type to search users..."
                  value={username}
                  onChange={(e) => handleUsernameInput(e.target.value)}
                  onBlur={() => setTimeout(() => setShowUserSuggestions(false), 200)}
                  onFocus={() => userSuggestions.length > 0 && setShowUserSuggestions(true)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors ${
                    targetError ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
                {showUserSuggestions && userSuggestions.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                    {userSuggestions.map((u) => (
                      <li
                        key={u.id}
                        onMouseDown={() => {
                          setUsername(u.username)
                          setShowUserSuggestions(false)
                        }}
                        className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-700">{u.username}</span>
                        <span className="text-xs text-slate-400">{u.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            /* Team input with autocomplete */
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Team <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type to search teams..."
                  value={teamQuery}
                  onChange={(e) => handleTeamInput(e.target.value)}
                  onBlur={() => setTimeout(() => setShowTeamSuggestions(false), 200)}
                  onFocus={() => {
                    if (teamQuery.trim().length > 0 && filteredTeams.length > 0) {
                      setShowTeamSuggestions(true)
                    } else if (teamQuery.trim().length === 0) {
                      // Show all teams when focusing empty input
                      setFilteredTeams(teams)
                      setShowTeamSuggestions(teams.length > 0)
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors ${
                    targetError ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
                {showTeamSuggestions && filteredTeams.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                    {filteredTeams.map((t) => (
                      <li
                        key={t.id}
                        onMouseDown={() => {
                          setTeamQuery(t.name)
                          setTeamId(t.id)
                          setShowTeamSuggestions(false)
                        }}
                        className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-700">{t.name}</span>
                        <span className="text-xs text-slate-400">
                          {t.members?.length ?? 0} member{(t.members?.length ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          {targetError && <p className="mb-3 text-xs text-red-600">{targetError}</p>}

          {/* Permission level */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Permission Level <span className="text-red-500">*</span>
            </label>
            <select
              {...register('permissionLevel')}
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors ${
                errors.permissionLevel ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-blue-500'
              }`}
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            {errors.permissionLevel && (
              <p className="mt-1 text-xs text-red-600">{errors.permissionLevel.message}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              VIEW: read-only &bull; EDIT: draw and modify &bull; ADMIN: full control
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : permission ? 'Update' : 'Grant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

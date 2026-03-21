// components/Teams/TeamList.jsx
// Team management page at /teams.
// Lists all teams with their member count and created date.
// The team creator can edit, delete, and manage members.
// Regular members can only view and leave the team.

import { Fragment, useEffect, useState, useRef } from 'react'
import { toast } from 'react-toastify'
import {
  FiPlus, FiEdit2, FiTrash2, FiUsers,
  FiChevronDown, FiChevronUp, FiUserMinus, FiUserPlus, FiLogOut,
} from 'react-icons/fi'

import {
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  getTeamById,
  leaveTeam,
} from '../../services/teamService'
import api from '../../services/api'
import TeamForm from './TeamForm'
import ConfirmDialog from '../common/ConfirmDialog'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import { formatDate } from '../../utils/dateUtils'

/**
 * TeamList
 * Team management page.
 */
export default function TeamList() {
  const [teams, setTeams]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [showForm, setShowForm]         = useState(false)
  const [editingTeam, setEditingTeam]   = useState(null)
  const [deletingTeam, setDeletingTeam] = useState(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  // Track which team's member panel is expanded
  const [expandedTeam, setExpandedTeam] = useState(null)
  // Expanded team's full data including members
  const [expandedData, setExpandedData] = useState(null)
  // New member username input + autocomplete
  const [newMemberUsername, setNewMemberUsername] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchTimer = useRef(null)

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // Check if the current user is the creator of a team
  const isCreator = (team) => {
    return team.createdBy?.username === currentUser.username
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  const loadTeams = async () => {
    try {
      setError(null)
      const data = await getAllTeams()
      setTeams(data)
    } catch (_err) {
      setError('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTeams() }, [])

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  const handleFormSubmit = async (data) => {
    setFormSubmitting(true)
    try {
      if (editingTeam) {
        const updated = await updateTeam(editingTeam.id, data)
        setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        toast.success('Team updated')
      } else {
        const created = await createTeam(data)
        setTeams((prev) => [...prev, created])
        toast.success('Team created')
      }
      setShowForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save team')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTeam(deletingTeam.id)
      setTeams((prev) => prev.filter((t) => t.id !== deletingTeam.id))
      toast.success('Team deleted')
    } catch (_err) {
      toast.error('Failed to delete team')
    } finally {
      setDeletingTeam(null)
    }
  }

  const handleLeaveTeam = async (teamId) => {
    try {
      await leaveTeam(teamId)
      setTeams((prev) => prev.filter((t) => t.id !== teamId))
      if (expandedTeam === teamId) {
        setExpandedTeam(null)
        setExpandedData(null)
      }
      toast.success('You left the team')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave team')
    }
  }

  // ---------------------------------------------------------------------------
  // Member management
  // ---------------------------------------------------------------------------

  /** Expand or collapse a team's member panel */
  const toggleExpand = async (team) => {
    if (expandedTeam === team.id) {
      setExpandedTeam(null)
      setExpandedData(null)
      return
    }
    try {
      // Load full team data (including members array) when expanding
      const full = await getTeamById(team.id)
      setExpandedTeam(team.id)
      setExpandedData(full)
    } catch (_err) {
      toast.error('Failed to load team members')
    }
  }

  const handleAddMember = async (teamId) => {
    if (!newMemberUsername.trim()) return
    setAddingMember(true)
    try {
      const updated = await addMember(teamId, newMemberUsername.trim())
      setExpandedData(updated)
      // Update the teams list so the member count reflects the change
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, members: updated.members } : t)))
      setNewMemberUsername('')
      toast.success('Member added')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (teamId, userId) => {
    try {
      await removeMember(teamId, userId)
      setExpandedData((prev) => {
        const updatedMembers = prev.members.filter((m) => m.id !== userId)
        // Update the teams list so the member count reflects the change
        setTeams((prevTeams) => prevTeams.map((t) => (t.id === teamId ? { ...t, members: updatedMembers } : t)))
        return { ...prev, members: updatedMembers }
      })
      toast.success('Member removed')
    } catch (_err) {
      toast.error('Failed to remove member')
    }
  }

  /** Search users as the user types (debounced) */
  const handleUsernameInput = (value) => {
    setNewMemberUsername(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (value.trim().length < 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get('/auth/users/search', { params: { q: value.trim() } })
        // Filter out users already in the team
        const memberIds = new Set((expandedData?.members || []).map((m) => m.id))
        setSuggestions((res.data || []).filter((u) => !memberIds.has(u.id)))
        setShowSuggestions(true)
      } catch (_e) {
        setSuggestions([])
      }
    }, 250)
  }

  const selectSuggestion = (user) => {
    setNewMemberUsername(user.username)
    setShowSuggestions(false)
    setSuggestions([])
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) return <LoadingSpinner message="Loading teams..." />

  return (
    <div className="max-w-screen-xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Teams</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage teams and their members</p>
        </div>
        <button
          onClick={() => { setEditingTeam(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus size={16} /> New Team
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Teams table */}
      {teams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <FiUsers className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-500">No teams yet. Create your first team.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Members</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teams.map((team) => {
                const creator = isCreator(team)
                return (
                  <Fragment key={team.id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {team.name}
                        {creator && (
                          <span className="ml-2 text-xs text-blue-500 font-normal">Owner</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                        {team.members?.length ?? 0} member{(team.members?.length ?? 0) !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        {formatDate(team.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {/* Toggle member panel */}
                          <button
                            onClick={() => toggleExpand(team)}
                            title="View members"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            {expandedTeam === team.id ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                          </button>
                          {creator ? (
                            <>
                              {/* Edit team name - only for creator */}
                              <button
                                onClick={() => { setEditingTeam(team); setShowForm(true) }}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                                title="Edit team"
                              >
                                <FiEdit2 size={15} />
                              </button>
                              {/* Delete team - only for creator */}
                              <button
                                onClick={() => setDeletingTeam(team)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete team"
                              >
                                <FiTrash2 size={15} />
                              </button>
                            </>
                          ) : (
                            /* Leave team - for members who are not the creator */
                            <button
                              onClick={() => handleLeaveTeam(team.id)}
                              className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded"
                              title="Leave team"
                            >
                              <FiLogOut size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded member management panel */}
                    {expandedTeam === team.id && expandedData && (
                      <tr>
                        <td colSpan={4} className="px-4 pb-4 bg-slate-50">
                          <div className="border border-slate-200 rounded-lg p-4 bg-white">
                            <p className="text-xs font-semibold text-slate-600 uppercase mb-3">
                              Members ({expandedData.members?.length ?? 0})
                            </p>

                            {/* Current members list */}
                            {(expandedData.members || []).length === 0 ? (
                              <p className="text-sm text-slate-400 mb-3">No members yet</p>
                            ) : (
                              <ul className="divide-y divide-slate-100 mb-3">
                                {(expandedData.members || []).map((member) => (
                                  <li key={member.id} className="flex items-center justify-between py-2">
                                    <div>
                                      <p className="text-sm font-medium text-slate-700">{member.username}</p>
                                      <p className="text-xs text-slate-400">{member.email}</p>
                                    </div>
                                    {/* Remove member button - only for creator */}
                                    {creator && (
                                      <button
                                        onClick={() => handleRemoveMember(team.id, member.id)}
                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        title="Remove member"
                                      >
                                        <FiUserMinus size={14} />
                                      </button>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}

                            {/* Add member input with autocomplete - only for creator */}
                            {creator && (
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <input
                                    type="text"
                                    placeholder="Type to search users..."
                                    value={newMemberUsername}
                                    onChange={(e) => handleUsernameInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        setShowSuggestions(false)
                                        handleAddMember(team.id)
                                      }
                                    }}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                                  />
                                  {showSuggestions && suggestions.length > 0 && (
                                    <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                      {suggestions.map((user) => (
                                        <li
                                          key={user.id}
                                          onMouseDown={() => selectSuggestion(user)}
                                          className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                                        >
                                          <span className="font-medium text-slate-700">{user.username}</span>
                                          <span className="text-xs text-slate-400">{user.email}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                                <button
                                  onClick={() => { setShowSuggestions(false); handleAddMember(team.id) }}
                                  disabled={addingMember}
                                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                                >
                                  <FiUserPlus size={14} /> Add
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / edit form modal */}
      {showForm && (
        <TeamForm
          team={editingTeam}
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
          isSubmitting={formSubmitting}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTeam}
        title="Delete Team"
        message={`Delete "${deletingTeam?.name}"? This will remove all team memberships.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTeam(null)}
      />
    </div>
  )
}

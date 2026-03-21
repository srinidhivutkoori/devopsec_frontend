// components/Permissions/PermissionList.jsx
// Manages access permissions for a single board.
// Loaded at /boards/:id/permissions.
// Displays existing user/team permissions in a table and allows
// adding new permissions or revoking existing ones.
// The board name and ID come from the URL parameter.

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiPlus, FiTrash2, FiArrowLeft, FiShield } from 'react-icons/fi'

import {
  getPermissionsByBoard,
  createPermission,
  updatePermission,
  deletePermission,
} from '../../services/permissionService'
import { getBoardById } from '../../services/boardService'
import PermissionForm from './PermissionForm'
import ConfirmDialog from '../common/ConfirmDialog'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import { formatDate } from '../../utils/dateUtils'

// Badge colour per permission level for quick visual scanning
const LEVEL_BADGE = {
  VIEW:  'bg-slate-100 text-slate-600',
  EDIT:  'bg-blue-100 text-blue-700',
  ADMIN: 'bg-purple-100 text-purple-700',
}

/**
 * PermissionList
 * Board permission management page.
 */
export default function PermissionList() {
  const { id: boardId } = useParams()
  const navigate = useNavigate()

  const [board, setBoard]                   = useState(null)
  const [permissions, setPermissions]       = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)
  const [showForm, setShowForm]             = useState(false)
  const [editingPerm, setEditingPerm]       = useState(null)
  const [deletingPerm, setDeletingPerm]     = useState(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Load board info and permissions on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [boardData, permsData] = await Promise.all([
          getBoardById(boardId),
          getPermissionsByBoard(boardId),
        ])
        setBoard(boardData)
        setPermissions(permsData)
      } catch (_err) {
        setError('Failed to load permissions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [boardId])

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  const handleFormSubmit = async (data) => {
    setFormSubmitting(true)
    try {
      if (editingPerm) {
        const updated = await updatePermission(boardId, editingPerm.id, {
          permissionLevel: data.permissionLevel,
        })
        setPermissions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        toast.success('Permission updated')
      } else {
        const created = await createPermission(boardId, data)
        setPermissions((prev) => [...prev, created])
        toast.success('Permission granted')
      }
      setShowForm(false)
      setEditingPerm(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save permission')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deletePermission(boardId, deletingPerm.id)
      setPermissions((prev) => prev.filter((p) => p.id !== deletingPerm.id))
      toast.success('Permission revoked')
    } catch (_err) {
      toast.error('Failed to revoke permission')
    } finally {
      setDeletingPerm(null)
    }
  }

  if (loading) return <LoadingSpinner message="Loading permissions..." />

  return (
    <div className="max-w-screen-xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/boards`)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <FiArrowLeft size={15} /> Boards
        </button>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-800">
          Permissions {board && `— ${board.name}`}
        </h1>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Action row */}
      <div className="flex justify-end">
        <button
          onClick={() => { setEditingPerm(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus size={16} /> Grant Permission
        </button>
      </div>

      {/* Permissions table */}
      {permissions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <FiShield className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-500">No permissions set. The board owner has full access.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Grantee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Level</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Granted</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-slate-50 transition-colors">
                  {/* Grantee name */}
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {perm.user?.username || perm.team?.name || 'Unknown'}
                  </td>
                  {/* User or Team badge */}
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {perm.team ? 'Team' : 'User'}
                    </span>
                  </td>
                  {/* Permission level badge */}
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_BADGE[perm.permissionLevel] || 'bg-slate-100 text-slate-600'}`}>
                      {perm.permissionLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                    {formatDate(perm.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {/* Edit level */}
                      <button
                        onClick={() => { setEditingPerm(perm); setShowForm(true) }}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      {/* Revoke */}
                      <button
                        onClick={() => setDeletingPerm(perm)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grant / edit permission form modal.
          key forces a remount (fresh state) when switching between create and edit. */}
      {showForm && (
        <PermissionForm
          key={editingPerm?.id ?? 'new'}
          permission={editingPerm}
          onSubmit={handleFormSubmit}
          onClose={() => { setShowForm(false); setEditingPerm(null) }}
          isSubmitting={formSubmitting}
        />
      )}

      {/* Revoke confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deletingPerm}
        title="Revoke Permission"
        message={`Revoke ${deletingPerm?.permissionLevel} access for ${deletingPerm?.user?.username || deletingPerm?.team?.name}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingPerm(null)}
        confirmLabel="Revoke"
        confirmClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  )
}

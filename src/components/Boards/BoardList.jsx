// components/Boards/BoardList.jsx
// Displays all boards the current user can access in a grid/table view.
// Supports creating new boards, editing board metadata, and deleting boards.
// A search bar filters boards client-side by name.
// Delete requires confirmation through the ConfirmDialog component.
// Navigation to the whiteboard canvas happens by clicking "Open" on any row.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FiPlus, FiEdit2, FiTrash2, FiExternalLink,
  FiSearch, FiLock, FiShare2,
} from 'react-icons/fi'

import {
  getAllBoards,
  createBoard,
  updateBoard,
  deleteBoard,
} from '../../services/boardService'
import BoardForm from './BoardForm'
import ConfirmDialog from '../common/ConfirmDialog'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import { formatDate } from '../../utils/dateUtils'

/**
 * BoardList
 * Main board management page at /boards.
 */
export default function BoardList() {
  const navigate = useNavigate()

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [boards, setBoards]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [searchQuery, setSearchQuery]     = useState('')
  const [showForm, setShowForm]           = useState(false)
  const [editingBoard, setEditingBoard]   = useState(null)  // null = create mode
  const [deletingBoard, setDeletingBoard] = useState(null)  // board to confirm delete
  const [formSubmitting, setFormSubmitting] = useState(false)

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  const loadBoards = async () => {
    try {
      setError(null)
      const data = await getAllBoards()
      setBoards(data)
    } catch (_err) {
      setError('Failed to load boards. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load boards on mount
  useEffect(() => { loadBoards() }, [])

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------

  /** Open the form modal in create mode */
  const handleCreate = () => {
    setEditingBoard(null)
    setShowForm(true)
  }

  /** Open the form modal in edit mode with the selected board pre-populated */
  const handleEdit = (board) => {
    setEditingBoard(board)
    setShowForm(true)
  }

  /** Submit create or update depending on whether editingBoard is set */
  const handleFormSubmit = async (data) => {
    setFormSubmitting(true)
    try {
      if (editingBoard) {
        // Update existing board
        const updated = await updateBoard(editingBoard.id, data)
        setBoards((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
        toast.success('Board updated successfully')
      } else {
        // Create new board
        const created = await createBoard(data)
        setBoards((prev) => [created, ...prev])
        toast.success('Board created successfully')
      }
      setShowForm(false)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save board'
      toast.error(msg)
    } finally {
      setFormSubmitting(false)
    }
  }

  /** Confirm and execute board deletion */
  const handleDelete = async () => {
    if (!deletingBoard) return
    try {
      await deleteBoard(deletingBoard.id)
      setBoards((prev) => prev.filter((b) => b.id !== deletingBoard.id))
      toast.success('Board deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete board')
    } finally {
      setDeletingBoard(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------
  const filteredBoards = boards.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) return <LoadingSpinner message="Loading boards..." />

  return (
    <div className="max-w-screen-xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Boards</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your collaborative whiteboards</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus size={16} /> New Board
        </button>
      </div>

      {/* Error message */}
      {error && <ErrorMessage message={error} />}

      {/* Search bar */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search boards by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-80 pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg
            outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Boards grid */}
      {filteredBoards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <FiExternalLink className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-500 font-medium">
            {searchQuery ? 'No boards match your search' : 'No boards yet'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleCreate}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Create your first board
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBoards.map((board) => (
            <div
              key={board.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Board colour preview strip */}
              <div
                className="h-12 w-full"
                style={{ backgroundColor: board.backgroundColor || '#f8fafc' }}
              />

              <div className="p-4">
                {/* Board name */}
                <h3 className="font-semibold text-slate-800 truncate" title={board.name}>
                  {board.name}
                </h3>

                {/* Metadata */}
                <p className="text-xs text-slate-400 mt-1">
                  {board.width} x {board.height} px &bull; Created {formatDate(board.createdAt)}
                </p>
                {board.owner && (
                  <p className="text-xs text-slate-400">Owner: {board.owner.username || board.owner}</p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-3">
                  {/* Open the whiteboard canvas */}
                  <button
                    onClick={() => navigate(`/boards/${board.id}`)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <FiExternalLink size={12} /> Open
                  </button>

                  {/* Manage permissions */}
                  <button
                    onClick={() => navigate(`/boards/${board.id}/permissions`)}
                    title="Permissions"
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <FiLock size={14} />
                  </button>

                  {/* Snapshots / version history */}
                  <button
                    onClick={() => navigate(`/boards/${board.id}/snapshots`)}
                    title="Version History"
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                  >
                    <FiShare2 size={14} />
                  </button>

                  {/* Edit board metadata */}
                  <button
                    onClick={() => handleEdit(board)}
                    title="Edit board"
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                  >
                    <FiEdit2 size={14} />
                  </button>

                  {/* Delete board - triggers confirmation dialog */}
                  <button
                    onClick={() => setDeletingBoard(board)}
                    title="Delete board"
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Board create/edit modal */}
      {showForm && (
        <BoardForm
          board={editingBoard}
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
          isSubmitting={formSubmitting}
        />
      )}

      {/* Delete confirmation modal */}
      <ConfirmDialog
        isOpen={!!deletingBoard}
        title="Delete Board"
        message={`Are you sure you want to delete "${deletingBoard?.name}"? This will permanently remove all elements and version history.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingBoard(null)}
      />
    </div>
  )
}

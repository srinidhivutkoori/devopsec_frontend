// components/Snapshots/SnapshotList.jsx
// Version history page for a board at /boards/:id/snapshots.
// Displays a timeline of snapshots with description, author, and timestamp.
// Users can create a new snapshot with a description or click an existing
// snapshot to open the SnapshotReplay view.

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import { FiPlus, FiArrowLeft, FiClock, FiEye } from 'react-icons/fi'

import { getSnapshotsByBoard, createSnapshot } from '../../services/snapshotService'
import { getBoardById } from '../../services/boardService'
import { snapshotSchema } from '../../utils/validators'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import { formatDateTime, timeAgo } from '../../utils/dateUtils'
import SnapshotReplay from './SnapshotReplay'

/**
 * SnapshotList
 * Version history management page.
 */
export default function SnapshotList() {
  const { id: boardId } = useParams()
  const navigate = useNavigate()

  const [board, setBoard]                   = useState(null)
  const [snapshots, setSnapshots]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating]             = useState(false)
  // Snapshot selected for replay - null means show the list
  const [replaySnapshot, setReplaySnapshot] = useState(null)

  // Snapshot description form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(snapshotSchema),
    mode: 'onChange',
  })

  // Load board and snapshots on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [boardData, snapsData] = await Promise.all([
          getBoardById(boardId),
          getSnapshotsByBoard(boardId),
        ])
        setBoard(boardData)
        // Show newest snapshots first
        setSnapshots([...snapsData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      } catch (_err) {
        setError('Failed to load version history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [boardId])

  // ---------------------------------------------------------------------------
  // Create snapshot
  // ---------------------------------------------------------------------------
  const handleCreate = async (data) => {
    setCreating(true)
    try {
      const snap = await createSnapshot(boardId, { description: data.description })
      setSnapshots((prev) => [snap, ...prev])
      reset()
      setShowCreateForm(false)
      toast.success('Snapshot saved')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save snapshot')
    } finally {
      setCreating(false)
    }
  }

  // Show the replay view when a snapshot is selected
  if (replaySnapshot) {
    return (
      <SnapshotReplay
        snapshots={snapshots}
        initialSnapshot={replaySnapshot}
        board={board}
        onClose={() => setReplaySnapshot(null)}
      />
    )
  }

  if (loading) return <LoadingSpinner message="Loading version history..." />

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate('/boards')}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <FiArrowLeft size={15} /> Boards
        </button>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-800">
          Version History {board && `— ${board.name}`}
        </h1>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Create snapshot button / inline form */}
      {showCreateForm ? (
        <form
          onSubmit={handleSubmit(handleCreate)}
          className="bg-white rounded-xl border border-slate-200 p-4"
          noValidate
        >
          <p className="text-sm font-medium text-slate-700 mb-2">New Snapshot Description</p>
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Describe this version..."
                {...register('description')}
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors ${
                  errors.description ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-blue-500'
                }`}
              />
              {/* Inline validation error */}
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-60"
            >
              {creating ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreateForm(false); reset() }}
              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <FiPlus size={16} /> Save Snapshot
          </button>
        </div>
      )}

      {/* Snapshot timeline */}
      {snapshots.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <FiClock className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-500">No snapshots yet. Save a snapshot to create a version checkpoint.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Column headings */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-semibold text-slate-500 uppercase">
            <span>Description</span>
            <span className="hidden sm:block">Created By</span>
            <span>Actions</span>
          </div>

          {/* Timeline entries */}
          <ul className="divide-y divide-slate-100">
            {snapshots.map((snap, index) => (
              <li key={snap.id} className="px-4 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                {/* Visual timeline dot */}
                <div className="flex flex-col items-center mt-1">
                  <div className={`w-3 h-3 rounded-full border-2 ${index === 0 ? 'border-emerald-500 bg-emerald-100' : 'border-slate-300 bg-white'}`} />
                  {index < snapshots.length - 1 && (
                    <div className="w-0.5 bg-slate-200 flex-1 mt-1" style={{ height: 24 }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Snapshot description */}
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {snap.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {timeAgo(snap.createdAt)} &bull; {formatDateTime(snap.createdAt)}
                  </p>
                  {snap.createdBy && (
                    <p className="text-xs text-slate-500">by {snap.createdBy.username || snap.createdBy}</p>
                  )}
                </div>

                {/* Replay button */}
                <button
                  onClick={() => setReplaySnapshot(snap)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0"
                >
                  <FiEye size={13} /> Replay
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

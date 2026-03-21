import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiLayout, FiSave, FiEdit2, FiTrash2,
  FiClock, FiRefreshCw, FiActivity,
} from 'react-icons/fi'

import { getRecentActivity } from '../../services/activityService'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'

/** Map action strings to icons and colors */
const ACTION_META = {
  BOARD_CREATED:  { icon: FiLayout,  color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Board Created' },
  BOARD_UPDATED:  { icon: FiEdit2,   color: 'text-blue-600',    bg: 'bg-blue-50',    label: 'Board Updated' },
  BOARD_DELETED:  { icon: FiTrash2,  color: 'text-red-500',     bg: 'bg-red-50',     label: 'Board Deleted' },
  SNAPSHOT_SAVED: { icon: FiSave,    color: 'text-purple-600',  bg: 'bg-purple-50',  label: 'Snapshot Saved' },
}

const DEFAULT_META = { icon: FiActivity, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Activity' }

/** Format a datetime string into a relative or absolute label */
function timeAgo(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

/**
 * ActivityFeed — replaces the analytics page.
 * Shows a chronological feed of all board-related actions.
 */
export default function ActivityFeed() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const navigate = useNavigate()

  const load = async () => {
    try {
      setError(null)
      const data = await getRecentActivity(50)
      setActivities(data)
    } catch (_e) {
      setError('Failed to load activity feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <LoadingSpinner message="Loading activity..." />

  return (
    <div className="max-w-screen-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Activity Feed</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Recent actions across all your boards
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); load() }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Feed */}
      {activities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <FiActivity className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-500">No activity yet. Start by creating a board!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {activities.map((a) => {
            const meta = ACTION_META[a.action] || DEFAULT_META
            const Icon = meta.icon
            return (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                {/* Icon */}
                <div className={`mt-0.5 p-2 rounded-lg ${meta.bg}`}>
                  <Icon size={16} className={meta.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">
                    <span className="font-semibold">{a.username}</span>{' '}
                    <span className="text-slate-500">{a.description}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                      {meta.label}
                    </span>
                    {a.boardName && a.boardId && (
                      <button
                        onClick={() => navigate(`/boards/${a.boardId}`)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {a.boardName}
                      </button>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap mt-1">
                  <FiClock size={12} />
                  {timeAgo(a.createdAt)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

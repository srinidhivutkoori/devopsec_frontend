// components/Analytics/CollaborationAnalytics.jsx
// Renders collaboration pattern charts using data from the analytics API.
// Shows a line chart of activity over time (hourly or daily counts) and a
// bar chart of peak collaboration hours so teams can see when they are most
// active together.
// The component normalises the backend response into the shape expected by
// recharts so the chart code is not coupled to the exact API response structure.

import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from 'recharts'
import { toast } from 'react-toastify'
import { FiActivity } from 'react-icons/fi'

import { getCollaborationPatterns } from '../../services/analyticsService'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'

/**
 * Normalise the raw API response into chart-ready arrays.
 * The backend may return different shapes depending on the implementation;
 * we handle the most common formats here.
 *
 * @param {object} data - Raw API response
 * @returns {{ lineData: object[], barData: object[] }}
 */
function normalisePatternData(data) {
  if (!data) return { lineData: [], barData: [] }

  // Format 1: { hourlyActivity: [{ hour, count }] or { 0: count, 1: count, ... } }
  if (data.hourlyActivity) {
    const hourly = data.hourlyActivity
    // Backend may return a Map<Integer, Long> (object) or an array
    const arr = Array.isArray(hourly)
      ? hourly
      : Object.entries(hourly).map(([k, v]) => ({ hour: Number(k), count: v }))
    const lineData = arr.map((d) => ({
      name:  `${d.hour ?? d.name ?? ''}:00`,
      value: d.count ?? d.value ?? 0,
    }))
    const barData = [...lineData].sort((a, b) => b.value - a.value).slice(0, 8)
    return { lineData, barData }
  }

  // Format 2: { patterns: [{ timestamp, activity }] }
  if (data.patterns) {
    const lineData = (data.patterns || []).map((d, i) => ({
      name:  d.timestamp || d.label || `T${i}`,
      value: d.activity  || d.count || d.value || 0,
    }))
    const barData = [...lineData].sort((a, b) => b.value - a.value).slice(0, 8)
    return { lineData, barData }
  }

  // Format 3: Direct array [{name, value}] or [{hour, count}]
  if (Array.isArray(data)) {
    const lineData = data.map((d, i) => ({
      name:  d.name || d.hour?.toString() || d.label || `${i}`,
      value: d.value || d.count || d.activity || 0,
    }))
    const barData = [...lineData].sort((a, b) => b.value - a.value).slice(0, 8)
    return { lineData, barData }
  }

  return { lineData: [], barData: [] }
}

/**
 * CollaborationAnalytics
 * Displays collaboration pattern visualisations.
 */
export default function CollaborationAnalytics() {
  const [rawData, setRawData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getCollaborationPatterns()
      .then(setRawData)
      .catch(() => {
        setError('Failed to load collaboration data')
        toast.error('Analytics unavailable')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner message="Loading collaboration data..." />
  if (error)   return <ErrorMessage message={error} />

  const { lineData, barData } = normalisePatternData(rawData)

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <FiActivity className="text-blue-500" size={20} />
        <h2 className="text-xl font-bold text-slate-800">Collaboration Patterns</h2>
      </div>

      {/* Activity over time - line chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-700 mb-4">Activity Over Time</h3>
        {lineData.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No activity data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={lineData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {/* Single line showing collaboration activity count */}
              <Line
                type="monotone"
                dataKey="value"
                name="Activity"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Peak collaboration hours - bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-700 mb-4">Peak Collaboration Hours</h3>
        {barData.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No peak data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              {/* Bars ordered by activity count descending */}
              <Bar dataKey="value" name="Interactions" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

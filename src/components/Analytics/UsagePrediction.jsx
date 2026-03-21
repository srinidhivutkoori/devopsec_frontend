// components/Analytics/UsagePrediction.jsx
// Renders predicted board usage for the next 7 or 30 days using data from
// the /api/analytics/usage-prediction endpoint.
// A line chart shows the predicted interaction count per day with a shaded
// confidence band where data is available.
// A trend indicator (up / down / stable) is shown based on slope direction.

import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi'
import { toast } from 'react-toastify'

import { getUsagePrediction } from '../../services/analyticsService'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'

/**
 * Normalise the raw API response into a chart-ready array.
 * @param {object} data
 * @returns {{ chartData: object[], trend: string, confidence: number }}
 */
function normaliseData(data) {
  if (!data) return { chartData: [], trend: 'stable', confidence: 0 }

  let chartData = []
  let trend     = 'stable'
  let confidence = data.confidence ?? 0

  // Format 1: { predictions: [{ date, value }], trend, confidence }
  if (data.predictions) {
    chartData = (data.predictions || []).map((d, i) => ({
      name:  d.date || d.label || `Day ${i + 1}`,
      value: d.value ?? d.count ?? d.predicted ?? 0,
      lower: d.lowerBound ?? null,
      upper: d.upperBound ?? null,
    }))
    trend = data.trend || 'stable'
    confidence = data.confidence ?? 0
  }
  // Format 2: direct array
  else if (Array.isArray(data)) {
    chartData = data.map((d, i) => ({
      name:  d.date || d.name || d.label || `Day ${i + 1}`,
      value: d.value ?? d.count ?? d.predicted ?? 0,
    }))
    // Derive trend from first vs last value
    if (chartData.length >= 2) {
      const first = chartData[0].value
      const last  = chartData[chartData.length - 1].value
      if (last > first * 1.05) trend = 'up'
      else if (last < first * 0.95) trend = 'down'
    }
  }
  // Format 3: { forecast: [...] }
  else if (data.forecast) {
    chartData = (data.forecast || []).map((d, i) => ({
      name:  d.date || `Day ${i + 1}`,
      value: d.value ?? d.count ?? 0,
    }))
    trend = data.trend || 'stable'
  }

  return { chartData, trend, confidence }
}

/** Small trend badge component */
function TrendBadge({ trend }) {
  const map = {
    up:     { icon: FiTrendingUp,   label: 'Increasing', cls: 'bg-emerald-100 text-emerald-700' },
    down:   { icon: FiTrendingDown, label: 'Decreasing', cls: 'bg-red-100 text-red-700' },
    stable: { icon: FiMinus,        label: 'Stable',     cls: 'bg-slate-100 text-slate-600' },
  }
  const { icon: Icon, label, cls } = map[trend] || map.stable
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      <Icon size={12} /> {label}
    </span>
  )
}

/**
 * UsagePrediction
 * Shows a predicted usage chart for the next 7-30 days.
 */
export default function UsagePrediction() {
  const [rawData, setRawData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getUsagePrediction()
      .then(setRawData)
      .catch(() => {
        setError('Failed to load usage prediction')
        toast.error('Usage prediction unavailable')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner message="Loading usage prediction..." />
  if (error)   return <ErrorMessage message={error} />

  const { chartData, trend, confidence } = normaliseData(rawData)

  // Average value used as a reference line on the chart
  const avgValue = chartData.length
    ? Math.round(chartData.reduce((s, d) => s + d.value, 0) / chartData.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Section header with trend indicator */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-800">Usage Prediction</h2>
        <div className="flex items-center gap-3">
          <TrendBadge trend={trend} />
          {confidence > 0 && (
            <span className="text-xs text-slate-400">
              Confidence: {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Prediction line chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-700 mb-1">
          Predicted Board Usage
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Forecast based on historical collaboration patterns
        </p>

        {chartData.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">
            No prediction data available
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />

              {/* Average reference line helps visualise trend direction */}
              {avgValue > 0 && (
                <ReferenceLine
                  y={avgValue}
                  stroke="#94a3b8"
                  strokeDasharray="4 3"
                  label={{ value: 'avg', position: 'right', fontSize: 10 }}
                />
              )}

              {/* Main predicted value line */}
              <Line
                type="monotone"
                dataKey="value"
                name="Predicted usage"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />

              {/* Upper bound confidence line (if available) */}
              {chartData.some((d) => d.upper !== null && d.upper !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="upper"
                  name="Upper bound"
                  stroke="#c4b5fd"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                  dot={false}
                />
              )}

              {/* Lower bound confidence line (if available) */}
              {chartData.some((d) => d.lower !== null && d.lower !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="lower"
                  name="Lower bound"
                  stroke="#c4b5fd"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary stat */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 mb-1">Forecast Period</p>
            <p className="text-lg font-bold text-slate-800">{chartData.length} days</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 mb-1">Average / Day</p>
            <p className="text-lg font-bold text-slate-800">{avgValue}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 mb-1">Peak Day</p>
            <p className="text-lg font-bold text-slate-800">
              {chartData.reduce((best, d) => (d.value > best.value ? d : best), chartData[0]).name}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

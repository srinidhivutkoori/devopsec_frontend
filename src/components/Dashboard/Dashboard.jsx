// components/Dashboard/Dashboard.jsx
// Application overview page shown immediately after login.
// Displays summary statistics (board count, element count, team count) as
// metric cards, a bar chart of elements per board, a pie chart of element
// type distribution, and a list of the most recently updated boards.
// Data is fetched from the board and analytics services on mount.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { FiLayout, FiBox, FiUsers, FiActivity, FiArrowRight } from 'react-icons/fi'
import { toast } from 'react-toastify'

import { getAllBoards } from '../../services/boardService'
import { getAllTeams } from '../../services/teamService'
import { getElementsByBoard } from '../../services/elementService'
import LoadingSpinner from '../common/LoadingSpinner'
import { timeAgo } from '../../utils/dateUtils'

// Colour palette for the element-type pie chart segments
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

// Element type labels mapped from backend enum values
const ELEMENT_TYPE_LABELS = {
  SHAPE:        'Shape',
  TEXT:         'Text',
  STICKY_NOTE:  'Sticky Note',
  IMAGE:        'Image',
  FREEHAND:     'Freehand',
}

/**
 * StatCard
 * Reusable metric card component used for the summary row.
 */
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="text-white" size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

/**
 * Dashboard
 * Main overview page showing stats, charts, and recent boards.
 */
export default function Dashboard() {
  const [boards, setBoards] = useState([])
  const [teams, setTeams]   = useState([])
  const [allElements, setAllElements] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch all boards, teams, and elements for the dashboard on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load boards and teams in parallel for speed
        const [boardsData, teamsData] = await Promise.all([
          getAllBoards(),
          getAllTeams(),
        ])
        setBoards(boardsData)
        setTeams(teamsData)

        // Load elements for each board (also in parallel)
        // We cap at the first 10 boards to avoid too many simultaneous requests
        const boardSlice = boardsData.slice(0, 10)
        const elementResults = await Promise.allSettled(
          boardSlice.map((b) => getElementsByBoard(b.id))
        )
        const elements = elementResults
          .filter((r) => r.status === 'fulfilled')
          .flatMap((r) => r.value)
        setAllElements(elements)
      } catch (_err) {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <LoadingSpinner message="Loading dashboard..." />

  // ---------------------------------------------------------------------------
  // Derived data for charts
  // ---------------------------------------------------------------------------

  // Elements-per-board bar chart data: [{name, count}]
  const elementsPerBoard = boards
    .map((b) => ({
      name: b.name.length > 15 ? b.name.slice(0, 15) + '...' : b.name,
      count: allElements.filter((e) => e.board?.id === b.id || e.boardId === b.id).length,
    }))
    .filter((d) => d.count > 0)
    .slice(0, 8) // limit to 8 boards so the chart stays readable

  // Element type distribution pie chart data: [{name, value}]
  const typeCounts = allElements.reduce((acc, el) => {
    const label = ELEMENT_TYPE_LABELS[el.type] || el.type
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }))

  // 5 most recently updated boards for the quick-access list
  const recentBoards = [...boards]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5)

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Collaborative Workspace</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview of your collaborative workspace
          </p>
        </div>
        <Link
          to="/activity"
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View activity <FiArrowRight size={14} />
        </Link>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiLayout}   label="Total Boards"   value={boards.length}       color="bg-blue-500" />
        <StatCard icon={FiBox}      label="Total Elements" value={allElements.length}   color="bg-emerald-500" />
        <StatCard icon={FiUsers}    label="Total Teams"    value={teams.length}         color="bg-violet-500" />
        <StatCard icon={FiActivity} label="Active Boards"  value={recentBoards.length}  color="bg-amber-500" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart: elements per board */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Elements per Board</h2>
          {elementsPerBoard.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No element data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={elementsPerBoard} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart: element type distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Element Types</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No elements drawn yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent boards list */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-700">Recent Boards</h2>
          <Link to="/boards" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {recentBoards.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            No boards yet.{' '}
            <Link to="/boards" className="text-blue-600 hover:underline">
              Create your first board.
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentBoards.map((board) => (
              <li key={board.id} className="py-3 flex items-center justify-between">
                <div>
                  {/* Board name links directly to the whiteboard canvas */}
                  <Link
                    to={`/boards/${board.id}`}
                    className="text-sm font-medium text-slate-800 hover:text-blue-600"
                  >
                    {board.name}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {board.width} x {board.height} &bull; Updated {timeAgo(board.updatedAt)}
                  </p>
                </div>
                {/* Colour swatch for the board background */}
                <div
                  className="w-6 h-6 rounded border border-slate-200"
                  style={{ backgroundColor: board.backgroundColor || '#ffffff' }}
                  title={board.backgroundColor || '#ffffff'}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// components/Snapshots/SnapshotReplay.jsx
// Read-only canvas replay for a selected version snapshot.
// Renders the elements stored in the snapshot's JSON data onto an HTML5
// canvas so the user can see what the board looked like at that point in time.
// Navigation arrows allow stepping through the sorted snapshot list
// without returning to the SnapshotList component.

import { useEffect, useRef, useState } from 'react'
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { formatDateTime } from '../../utils/dateUtils'

// ---------------------------------------------------------------------------
// Minimal canvas renderer - mirrors the logic in WhiteboardCanvas.jsx
// but in a simpler read-only form since we don't need interaction.
// ---------------------------------------------------------------------------

/**
 * Draw a single element onto the canvas.
 * (Duplicated from WhiteboardCanvas to keep this component self-contained.)
 */
function drawElement(ctx, el) {
  const style = typeof el.style === 'string' ? JSON.parse(el.style || '{}') : (el.style || {})
  const strokeColor = style.strokeColor || '#1e293b'
  const fillColor   = style.fillColor   || 'transparent'
  const lineWidth   = style.lineWidth   || 2
  const fontSize    = style.fontSize    || 16
  const fontFamily  = style.fontFamily  || 'sans-serif'

  ctx.save()
  ctx.translate(el.x, el.y)
  ctx.strokeStyle = strokeColor
  ctx.fillStyle   = fillColor
  ctx.lineWidth   = lineWidth
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'

  switch (el.type) {
    case 'SHAPE': {
      const shape = style.shape || 'RECTANGLE'
      if (shape === 'ELLIPSE' || shape === 'CIRCLE') {
        ctx.beginPath()
        ctx.ellipse(el.width / 2, el.height / 2, Math.abs(el.width / 2), Math.abs(el.height / 2), 0, 0, Math.PI * 2)
        if (fillColor !== 'transparent') ctx.fill()
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.rect(0, 0, el.width, el.height)
        if (fillColor !== 'transparent') ctx.fill()
        ctx.stroke()
      }
      break
    }
    case 'TEXT': {
      ctx.font = `${fontSize}px ${fontFamily}`
      ctx.fillStyle = strokeColor
      ctx.textBaseline = 'top'
      wrapText(ctx, el.content || 'Text', 0, 0, el.width, fontSize * 1.4)
      break
    }
    case 'STICKY_NOTE': {
      const noteColor = style.noteColor || '#fef08a'
      ctx.fillStyle = noteColor
      ctx.fillRect(0, 0, el.width, el.height)
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, el.width, el.height)
      ctx.fillStyle = '#1e293b'
      ctx.font = `${fontSize}px ${fontFamily}`
      ctx.textBaseline = 'top'
      wrapText(ctx, el.content || 'Note', 8, 8, el.width - 16, fontSize * 1.4)
      break
    }
    case 'FREEHAND': {
      let points = []
      try { points = JSON.parse(el.content || '[]') } catch (_e) { points = [] }
      if (points.length < 2) break
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
      ctx.stroke()
      break
    }
    default:
      break
  }

  ctx.restore()
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ')
  let line = ''
  let currentY = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY)
      line = word
      currentY += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, currentY)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * SnapshotReplay
 * Read-only canvas view of a historical board snapshot.
 *
 * @param {object}   props
 * @param {object[]} props.snapshots        - Full ordered list of snapshots
 * @param {object}   props.initialSnapshot  - The snapshot to show first
 * @param {object}   props.board            - Board metadata (for background colour)
 * @param {function} props.onClose          - Return to the SnapshotList
 */
export default function SnapshotReplay({ snapshots, initialSnapshot, board, onClose }) {
  // Index into the `snapshots` array currently being shown
  const [currentIndex, setCurrentIndex] = useState(
    snapshots.findIndex((s) => s.id === initialSnapshot.id)
  )
  const canvasRef = useRef(null)

  const currentSnapshot = snapshots[currentIndex] || initialSnapshot

  // Parse the snapshot data.  The backend stores elements as JSON in snapshotData.
  const snapshotElements = (() => {
    try {
      const data = currentSnapshot.snapshotData
      if (typeof data === 'string') return JSON.parse(data)
      if (Array.isArray(data)) return data
      // If it's an object with an elements array
      if (data?.elements) return data.elements
      return []
    } catch (_e) {
      return []
    }
  })()

  // Render snapshot elements onto canvas whenever the current snapshot changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    if (parent) {
      canvas.width  = parent.clientWidth  || 800
      canvas.height = parent.clientHeight || 600
    }

    const ctx = canvas.getContext('2d')

    // Clear and fill background
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = board?.backgroundColor || '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Render each stored element
    snapshotElements.forEach((el) => {
      try {
        drawElement(ctx, el)
      } catch (_e) {
        // Silently skip malformed elements to avoid crashing the replay
      }
    })
  }, [currentIndex, snapshotElements, board])

  const hasPrev = currentIndex < snapshots.length - 1
  const hasNext = currentIndex > 0

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 h-12 bg-white border-b border-slate-200 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <FiX size={16} /> Close Replay
        </button>

        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm font-medium text-slate-700 truncate">
            {currentSnapshot.description}
          </p>
          <p className="text-xs text-slate-400">
            {formatDateTime(currentSnapshot.createdAt)}
            {currentSnapshot.createdBy && ` by ${currentSnapshot.createdBy.username || currentSnapshot.createdBy}`}
          </p>
        </div>

        {/* Snapshot count indicator */}
        <span className="text-xs text-slate-400">
          {currentIndex + 1} / {snapshots.length}
        </span>

        {/* Navigation arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            disabled={!hasPrev}
            title="Older snapshot"
            className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FiChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentIndex((i) => i - 1)}
            disabled={!hasNext}
            title="Newer snapshot"
            className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Read-only canvas area */}
      <div className="flex-1 relative bg-slate-100 overflow-hidden">
        {/* "Read-only" watermark */}
        <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
          Read-only replay
        </div>

        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />

        {/* Empty state when no elements were captured */}
        {snapshotElements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-slate-400 text-sm">
              No elements were captured in this snapshot
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// components/Boards/WhiteboardCanvas.jsx
// The main whiteboard canvas page.  Loaded at /boards/:id.
//
// Architecture:
//   - HTML5 <canvas> element for all drawing.  Elements are stored in React
//     state (the `elements` array) and re-rendered on every state change by
//     calling redrawCanvas().
//   - Drawing tools: Select, Freehand, Rectangle, Ellipse, Text, Sticky Note.
//   - Interaction model:
//       mousedown  -> start drawing or start moving a selected element
//       mousemove  -> update in-progress shape / move element
//       mouseup    -> finalise shape, persist to backend
//   - Real-time collaboration: on mount the component connects to the STOMP
//     WebSocket and subscribes to /topic/boards/{id}.  Incoming messages
//     are applied to the local elements array without triggering another
//     broadcast, so all collaborators stay in sync.
//   - Element lock: selecting an element attempts to lock it on the backend.
//     If another user holds the lock, the element is drawn with a striped
//     overlay and cannot be moved by this user.
//   - Version snapshots: the "Save Snapshot" button calls the snapshot API.

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FiArrowLeft, FiCamera, FiLock, FiUnlock,
  FiTrash2, FiZoomIn, FiZoomOut,
} from 'react-icons/fi'

import { getBoardById } from '../../services/boardService'
import {
  getElementsByBoard,
  createElement,
  updateElement,
  deleteElement,
  lockElement,
  unlockElement,
} from '../../services/elementService'
import { createSnapshot } from '../../services/snapshotService'
import * as ws from '../../services/websocketService'
import ElementToolbar from '../Elements/ElementToolbar'
import ElementProperties from '../Elements/ElementProperties'
import LoadingSpinner from '../common/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

/**
 * Redraw all elements onto the canvas context.
 * Called whenever the elements array changes or the user pans/zooms.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object[]} elements
 * @param {object|null} selectedElement
 * @param {object|null} drawingPreview - In-progress shape before mouseup
 * @param {{ x:number, y:number, scale:number }} viewport
 * @param {string} boardBg - board background colour
 */
function redrawCanvas(ctx, elements, selectedElement, drawingPreview, viewport, boardBg) {
  const { width, height } = ctx.canvas

  // Clear the entire canvas before redrawing
  ctx.clearRect(0, 0, width, height)

  // Fill board background
  ctx.save()
  ctx.fillStyle = boardBg || '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  // Apply viewport transform (pan + zoom)
  ctx.save()
  ctx.translate(viewport.x, viewport.y)
  ctx.scale(viewport.scale, viewport.scale)

  // Draw each persisted element
  elements.forEach((el) => drawElement(ctx, el, el === selectedElement || el.id === selectedElement?.id))

  // Draw the in-progress shape as a preview while the user is dragging
  if (drawingPreview) {
    drawElement(ctx, drawingPreview, false, true)
  }

  ctx.restore()
}

/**
 * Render a single element onto the canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} el - Element data object
 * @param {boolean} isSelected - Whether to draw a selection border
 * @param {boolean} isPreview - Whether this is a temporary preview shape
 */
function drawElement(ctx, el, isSelected, isPreview = false) {
  const style = typeof el.style === 'string' ? JSON.parse(el.style || '{}') : (el.style || {})
  const strokeColor = style.strokeColor || '#1e293b'
  const fillColor   = style.fillColor   || 'transparent'
  const lineWidth   = style.lineWidth   || 2
  const fontSize    = style.fontSize    || 16
  const fontFamily  = style.fontFamily  || 'sans-serif'

  ctx.save()

  // Move context origin to the element's position
  ctx.translate(el.x, el.y)

  // Global alpha for preview shapes to give a "ghost" appearance
  if (isPreview) ctx.globalAlpha = 0.6

  ctx.strokeStyle = strokeColor
  ctx.fillStyle   = fillColor
  ctx.lineWidth   = lineWidth
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'

  switch (el.type) {
    case 'SHAPE': {
      // Determine shape sub-type from style; default is rectangle
      const shape = style.shape || 'RECTANGLE'
      if (shape === 'ELLIPSE' || shape === 'CIRCLE') {
        // Draw an ellipse fitting inside the element's bounding box
        ctx.beginPath()
        ctx.ellipse(
          el.width / 2, el.height / 2,
          Math.abs(el.width / 2), Math.abs(el.height / 2),
          0, 0, Math.PI * 2
        )
        if (fillColor !== 'transparent') ctx.fill()
        ctx.stroke()
      } else {
        // Default: rectangle
        ctx.beginPath()
        ctx.rect(0, 0, el.width, el.height)
        if (fillColor !== 'transparent') ctx.fill()
        ctx.stroke()
      }
      break
    }

    case 'TEXT': {
      ctx.font = `${fontSize}px ${fontFamily}`
      ctx.fillStyle = strokeColor  // text uses stroke colour as foreground
      ctx.textBaseline = 'top'
      // Wrap text within the element width
      wrapText(ctx, el.content || 'Text', 0, 0, el.width, fontSize * 1.4)
      break
    }

    case 'STICKY_NOTE': {
      // Yellow sticky note background with rounded corners
      const noteColor = style.noteColor || '#fef08a'
      const shadowOffset = 3
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(shadowOffset, shadowOffset, el.width, el.height)
      // Note body
      ctx.fillStyle = noteColor
      ctx.fillRect(0, 0, el.width, el.height)
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, el.width, el.height)
      // Note text
      ctx.fillStyle = '#1e293b'
      ctx.font = `${fontSize}px ${fontFamily}`
      ctx.textBaseline = 'top'
      wrapText(ctx, el.content || 'Note', 8, 8, el.width - 16, fontSize * 1.4)
      break
    }

    case 'FREEHAND': {
      // Freehand paths are stored as an array of {x, y} points in content
      let points = []
      try {
        points = JSON.parse(el.content || '[]')
      } catch (_e) {
        points = []
      }
      if (points.length < 2) break
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.stroke()
      break
    }

    case 'IMAGE': {
      // Image elements show a placeholder rectangle with a label
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(0, 0, el.width, el.height)
      ctx.strokeStyle = '#94a3b8'
      ctx.strokeRect(0, 0, el.width, el.height)
      ctx.fillStyle = '#64748b'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('[Image]', el.width / 2, el.height / 2)
      ctx.textAlign = 'left'
      break
    }

    default:
      break
  }

  // Draw a blue selection border when this element is selected
  if (isSelected && !isPreview) {
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 4])
    ctx.strokeRect(-3, -3, el.width + 6, el.height + 6)
    ctx.setLineDash([])

    // Draw resize handle in bottom-right corner
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(el.width - 4, el.height - 4, 8, 8)
  }

  // Draw a red striped overlay if element is locked by another user
  if (el.locked) {
    ctx.fillStyle = 'rgba(239,68,68,0.12)'
    ctx.fillRect(0, 0, el.width, el.height)
    ctx.strokeStyle = 'rgba(239,68,68,0.5)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.strokeRect(0, 0, el.width, el.height)
    ctx.setLineDash([])
  }

  ctx.restore()
}

/**
 * Draw text with word wrapping within a given maxWidth.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {number} maxWidth
 * @param {number} lineHeight
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ')
  let line = ''
  let currentY = y

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY)
      line = word
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  if (line) ctx.fillText(line, x, currentY)
}

/**
 * Hit-test: check whether canvas coordinates (cx, cy) fall within element el.
 * TEXT and FREEHAND elements have width/height of 0 so we compute a bounding box.
 * @param {object} el
 * @param {number} cx - Canvas x (already transformed by viewport)
 * @param {number} cy - Canvas y (already transformed by viewport)
 * @returns {boolean}
 */
function hitTest(el, cx, cy) {
  // TEXT elements: use a default bounding box based on content length
  if (el.type === 'TEXT' && el.width === 0 && el.height === 0) {
    const style = typeof el.style === 'string' ? JSON.parse(el.style || '{}') : (el.style || {})
    const fontSize = style.fontSize || 16
    const text = el.content || 'Text'
    const estWidth = Math.max(text.length * fontSize * 0.6, 60)
    const estHeight = fontSize * 1.6
    return cx >= el.x && cx <= el.x + estWidth && cy >= el.y && cy <= el.y + estHeight
  }

  // FREEHAND elements: compute bounding box from path points
  if (el.type === 'FREEHAND') {
    let points = []
    try { points = JSON.parse(el.content || '[]') } catch (_e) { points = [] }
    if (points.length < 2) return false
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const margin = 10
    const minX = Math.min(...xs) - margin
    const maxX = Math.max(...xs) + margin
    const minY = Math.min(...ys) - margin
    const maxY = Math.max(...ys) + margin
    return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY
  }

  return cx >= el.x && cx <= el.x + el.width && cy >= el.y && cy <= el.y + el.height
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * WhiteboardCanvas
 * Interactive whiteboard at /boards/:id.
 */
export default function WhiteboardCanvas() {
  const { id: boardId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Canvas DOM ref
  const canvasRef = useRef(null)

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [board, setBoard]                   = useState(null)
  const [elements, setElements]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [selectedElement, setSelectedElement] = useState(null)
  const [activeTool, setActiveTool]         = useState('SELECT')
  const [toolStyle, setToolStyle]           = useState({
    strokeColor: '#1e293b',
    fillColor:   'transparent',
    lineWidth:   2,
    fontSize:    16,
    shape:       'RECTANGLE',   // sub-type for SHAPE tool
    noteColor:   '#fef08a',
  })
  const [showProperties, setShowProperties] = useState(false)
  const [snapshotDesc, setSnapshotDesc]     = useState('')
  const [showSnapshotInput, setShowSnapshotInput] = useState(false)
  const [viewport, setViewport]             = useState({ x: 0, y: 0, scale: 1 })
  const [wsConnected, setWsConnected]       = useState(false)

  // Drawing state held in refs to avoid stale closures in mouse handlers
  const isDrawingRef   = useRef(false)
  const drawStartRef   = useRef({ x: 0, y: 0 })      // mouse-down canvas position
  const freehandRef    = useRef([])                    // accumulated freehand points
  const movingRef      = useRef(false)                 // whether we're dragging a selection
  const moveOffsetRef  = useRef({ dx: 0, dy: 0 })     // offset from element origin to cursor
  const previewRef     = useRef(null)                  // in-progress shape for redraw
  const elementsRef    = useRef(elements)              // mutable ref for event handlers

  // Keep the elements ref synchronised with state
  useEffect(() => { elementsRef.current = elements }, [elements])

  // ---------------------------------------------------------------------------
  // Canvas redraw whenever display state changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !board) return
    const ctx = canvas.getContext('2d')
    redrawCanvas(ctx, elements, selectedElement, previewRef.current, viewport, board.backgroundColor)
  }, [elements, selectedElement, viewport, board])

  // ---------------------------------------------------------------------------
  // Resize canvas to fill its container
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver(() => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width  = parent.clientWidth
        canvas.height = parent.clientHeight
      }
      // Redraw after resize to prevent blank canvas
      if (board) {
        const ctx = canvas.getContext('2d')
        redrawCanvas(ctx, elementsRef.current, selectedElement, previewRef.current, viewport, board.backgroundColor)
      }
    })
    resizeObserver.observe(canvas.parentElement || canvas)
    return () => resizeObserver.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board])

  // ---------------------------------------------------------------------------
  // Load board data and connect WebSocket on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let subscriptionKey = null

    const init = async () => {
      try {
        // Fetch board metadata and its current elements in parallel
        const [boardData, elementsData] = await Promise.all([
          getBoardById(boardId),
          getElementsByBoard(boardId),
        ])
        setBoard(boardData)
        setElements(elementsData)
      } catch (_err) {
        toast.error('Failed to load board')
        navigate('/boards')
        return
      } finally {
        setLoading(false)
      }

      // Connect to WebSocket for real-time collaboration
      try {
        const token = localStorage.getItem('token')
        await ws.connect(token)
        setWsConnected(true)

        // Subscribe to board topic to receive changes from other users
        subscriptionKey = ws.subscribeToBoardUpdates(boardId, (message) => {
          handleWebSocketMessage(message)
        })
      } catch (_err) {
        // WebSocket failure is non-fatal - the user can still work offline
        toast.warn('Real-time collaboration unavailable')
      }
    }

    init()

    // Clean up WebSocket subscription when component unmounts
    return () => {
      if (subscriptionKey) ws.unsubscribeFromBoard(subscriptionKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId])

  // ---------------------------------------------------------------------------
  // WebSocket message handler
  // ---------------------------------------------------------------------------
  const handleWebSocketMessage = useCallback((message) => {
    // Message shape: { action: 'CREATE'|'UPDATE'|'DELETE', element: {...} }
    const { action, element } = message

    if (action === 'CREATE') {
      setElements((prev) => {
        // Avoid duplicates if the server echoes our own creates
        if (prev.find((e) => e.id === element.id)) return prev
        return [...prev, element]
      })
    } else if (action === 'UPDATE') {
      setElements((prev) => prev.map((e) => (e.id === element.id ? element : e)))
    } else if (action === 'DELETE') {
      setElements((prev) => prev.filter((e) => e.id !== element.id))
      setSelectedElement((prev) => (prev?.id === element.id ? null : prev))
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Coordinate conversion: mouse event -> canvas space (accounting for viewport)
  // ---------------------------------------------------------------------------
  const toCanvasCoords = useCallback((e) => {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    // Raw position relative to canvas element
    const rawX = e.clientX - rect.left
    const rawY = e.clientY - rect.top
    // Invert the viewport transform to get world coordinates
    const worldX = (rawX - viewport.x) / viewport.scale
    const worldY = (rawY - viewport.y) / viewport.scale
    return { x: worldX, y: worldY }
  }, [viewport])

  // Determine if the user has view-only access
  const viewOnly = board?.permissionLevel === 'VIEW'

  // ---------------------------------------------------------------------------
  // Mouse event handlers
  // ---------------------------------------------------------------------------

  const handleMouseDown = useCallback((e) => {
    // Only respond to the primary (left) mouse button
    if (e.button !== 0) return
    const pos = toCanvasCoords(e)

    if (activeTool === 'SELECT') {
      // Find the top-most element under the cursor (search in reverse z-order)
      const sorted = [...elementsRef.current].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
      const hit    = sorted.find((el) => hitTest(el, pos.x, pos.y))

      if (hit) {
        // View-only users can select to inspect but not move
        if (viewOnly) {
          setSelectedElement(hit)
          setShowProperties(true)
          return
        }
        // Only allow moving if not locked by someone else
        const lockedByName = hit.lockedBy?.username || hit.lockedBy
        if (!hit.locked || lockedByName === user?.username) {
          setSelectedElement(hit)
          movingRef.current   = true
          moveOffsetRef.current = { dx: pos.x - hit.x, dy: pos.y - hit.y }
          setShowProperties(true)
          // Attempt to lock the element on the backend
          lockElement(boardId, hit.id).catch(() => {})
        } else {
          toast.warn(`Element locked by ${lockedByName}`)
        }
      } else {
        // Clicked on empty canvas - deselect
        setSelectedElement(null)
        setShowProperties(false)
      }
    } else if (!viewOnly) {
      // Start drawing a new shape (only if not view-only)
      isDrawingRef.current  = true
      drawStartRef.current  = pos
      freehandRef.current   = [pos]  // reset freehand point list
      previewRef.current    = null
    }
  }, [activeTool, boardId, user, viewOnly, toCanvasCoords])

  const handleMouseMove = useCallback((e) => {
    const pos = toCanvasCoords(e)

    if (movingRef.current && selectedElement) {
      // Drag the selected element
      const newX = Math.max(0, pos.x - moveOffsetRef.current.dx)
      const newY = Math.max(0, pos.y - moveOffsetRef.current.dy)
      setElements((prev) =>
        prev.map((el) =>
          el.id === selectedElement.id ? { ...el, x: newX, y: newY } : el
        )
      )
      setSelectedElement((prev) => prev ? { ...prev, x: newX, y: newY } : prev)
      return
    }

    if (!isDrawingRef.current) return

    const start = drawStartRef.current

    if (activeTool === 'FREEHAND') {
      // Accumulate points for the freehand path
      freehandRef.current.push(pos)
      // Build a preview element for immediate visual feedback
      previewRef.current = {
        id: '__preview__',
        type: 'FREEHAND',
        x: 0, y: 0, width: 0, height: 0,
        content: JSON.stringify(freehandRef.current),
        style: { strokeColor: toolStyle.strokeColor, lineWidth: toolStyle.lineWidth },
      }
    } else if (activeTool === 'TEXT' || activeTool === 'STICKY_NOTE') {
      // For text/sticky, just show a bounding box preview
      previewRef.current = {
        id: '__preview__',
        type: activeTool === 'TEXT' ? 'TEXT' : 'STICKY_NOTE',
        x: Math.min(start.x, pos.x),
        y: Math.min(start.y, pos.y),
        width:  Math.abs(pos.x - start.x),
        height: Math.abs(pos.y - start.y),
        content: activeTool === 'TEXT' ? 'Text' : 'Note',
        style: { ...toolStyle },
      }
    } else {
      // SHAPE tool (rectangle or ellipse)
      previewRef.current = {
        id: '__preview__',
        type: 'SHAPE',
        x: Math.min(start.x, pos.x),
        y: Math.min(start.y, pos.y),
        width:  Math.abs(pos.x - start.x),
        height: Math.abs(pos.y - start.y),
        content: '',
        style: { ...toolStyle },
      }
    }

    // Trigger redraw with the updated preview by forcing a re-render
    const canvas = canvasRef.current
    if (canvas && board) {
      const ctx = canvas.getContext('2d')
      redrawCanvas(ctx, elementsRef.current, selectedElement, previewRef.current, viewport, board.backgroundColor)
    }
  }, [activeTool, toolStyle, selectedElement, viewport, board, toCanvasCoords])

  const handleMouseUp = useCallback(async (e) => {
    const pos = toCanvasCoords(e)

    // Finalise a move operation
    if (movingRef.current && selectedElement) {
      movingRef.current = false
      try {
        // Persist the new position to the backend
        const updated = await updateElement(boardId, selectedElement.id, {
          ...selectedElement,
          x: selectedElement.x,
          y: selectedElement.y,
        })
        setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)))
        setSelectedElement(updated)
        // Broadcast the move to other collaborators
        ws.sendElementUpdate(boardId, { action: 'UPDATE', element: updated })
        // Release the lock now that the move is complete
        await unlockElement(boardId, updated.id).catch(() => {})
      } catch (_err) {
        toast.error('Failed to save element position')
      }
      return
    }

    if (!isDrawingRef.current) return
    isDrawingRef.current  = false
    previewRef.current    = null

    const start = drawStartRef.current
    const width  = Math.abs(pos.x - start.x)
    const height = Math.abs(pos.y - start.y)

    // Ignore tiny accidental clicks (less than 5px in either dimension)
    if (width < 5 && height < 5 && activeTool !== 'FREEHAND') return

    // Build the new element payload (const is correct - object contents mutate, not the binding)
    const newElement = {
      type:    activeTool === 'FREEHAND' ? 'FREEHAND' : activeTool === 'TEXT' ? 'TEXT' : activeTool === 'STICKY_NOTE' ? 'STICKY_NOTE' : 'SHAPE',
      x:       activeTool === 'FREEHAND' ? 0 : Math.min(start.x, pos.x),
      y:       activeTool === 'FREEHAND' ? 0 : Math.min(start.y, pos.y),
      width:   activeTool === 'FREEHAND' ? 0 : width,
      height:  activeTool === 'FREEHAND' ? 0 : height,
      content: activeTool === 'FREEHAND' ? JSON.stringify(freehandRef.current) : activeTool === 'TEXT' ? 'Text' : activeTool === 'STICKY_NOTE' ? 'Note' : '',
      style:   JSON.stringify(toolStyle),
      zIndex:  elements.length,
    }

    // Optimistically add the element to the canvas immediately so the user
    // sees their drawing even if the backend is slow or temporarily unavailable
    const tempId = `temp-${Date.now()}`
    const optimistic = { ...newElement, id: tempId }
    setElements((prev) => [...prev, optimistic])
    freehandRef.current = []

    try {
      // Persist to backend - response includes the server-assigned ID
      const created = await createElement(boardId, newElement)
      // Replace the temporary element with the server-confirmed one
      setElements((prev) => prev.map((el) => el.id === tempId ? created : el))
      // Broadcast to collaborators
      ws.sendElementUpdate(boardId, { action: 'CREATE', element: created })
    } catch (_err) {
      toast.error('Failed to save element to server')
    }
  }, [activeTool, boardId, elements.length, selectedElement, toolStyle, toCanvasCoords])

  // ---------------------------------------------------------------------------
  // Element actions (toolbar / properties)
  // ---------------------------------------------------------------------------

  const handleDeleteSelected = useCallback(async () => {
    if (!selectedElement) return
    try {
      await deleteElement(boardId, selectedElement.id)
      setElements((prev) => prev.filter((e) => e.id !== selectedElement.id))
      ws.sendElementUpdate(boardId, { action: 'DELETE', element: selectedElement })
      setSelectedElement(null)
      setShowProperties(false)
      toast.success('Element deleted')
    } catch (_err) {
      toast.error('Failed to delete element')
    }
  }, [boardId, selectedElement])

  const handleToggleLock = useCallback(async () => {
    if (!selectedElement) return
    try {
      let updated
      if (selectedElement.locked) {
        updated = await unlockElement(boardId, selectedElement.id)
      } else {
        updated = await lockElement(boardId, selectedElement.id)
      }
      setElements((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
      setSelectedElement(updated)
      ws.sendElementUpdate(boardId, { action: 'UPDATE', element: updated })
      // Lock/unlock is silent - no toast notification needed
    } catch (_err) {
      toast.error('Failed to toggle lock')
    }
  }, [boardId, selectedElement])

  /** Update element properties from the side panel and persist */
  const handlePropertiesChange = useCallback(async (changes) => {
    if (!selectedElement) return
    const merged = { ...selectedElement, ...changes }
    try {
      const updated = await updateElement(boardId, selectedElement.id, merged)
      setElements((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
      setSelectedElement(updated)
      ws.sendElementUpdate(boardId, { action: 'UPDATE', element: updated })
    } catch (_err) {
      toast.error('Failed to update element')
    }
  }, [boardId, selectedElement])

  // ---------------------------------------------------------------------------
  // Snapshot
  // ---------------------------------------------------------------------------
  const handleSaveSnapshot = async () => {
    if (!snapshotDesc.trim()) {
      toast.warn('Please enter a description for this snapshot')
      return
    }
    try {
      await createSnapshot(boardId, { description: snapshotDesc.trim() })
      toast.success('Snapshot saved')
      setSnapshotDesc('')
      setShowSnapshotInput(false)
    } catch (_err) {
      toast.error('Failed to save snapshot')
    }
  }

  // ---------------------------------------------------------------------------
  // Zoom controls
  // ---------------------------------------------------------------------------
  const zoom = (delta) => {
    setViewport((prev) => {
      const newScale = Math.max(0.2, Math.min(4, prev.scale + delta))
      return { ...prev, scale: newScale }
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) return <LoadingSpinner message="Loading whiteboard..." />
  if (!board)  return null

  return (
    // Full viewport layout - no padding so the canvas fills all available space
    <div className="flex flex-col h-full -m-6">
      {/* Top bar: back button, board name, controls */}
      <div className="flex items-center gap-3 px-4 h-12 bg-white border-b border-slate-200 flex-shrink-0">
        <button
          onClick={() => navigate('/boards')}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <FiArrowLeft size={15} /> Back
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-slate-800 truncate">{board.name}</h1>
        </div>

        {/* View-only badge */}
        {viewOnly && (
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
            View Only
          </span>
        )}

        {/* Connection status indicator */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          <span className="text-xs text-slate-400">{wsConnected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => zoom(-0.1)}
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
            title="Zoom out"
          >
            <FiZoomOut size={16} />
          </button>
          <span className="text-xs text-slate-500 w-10 text-center">
            {Math.round(viewport.scale * 100)}%
          </span>
          <button
            onClick={() => zoom(0.1)}
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
            title="Zoom in"
          >
            <FiZoomIn size={16} />
          </button>
        </div>

        {/* Selected element controls - hidden for view-only users */}
        {selectedElement && !viewOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleLock}
              title={selectedElement.locked ? 'Unlock element' : 'Lock element'}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              {selectedElement.locked ? <FiUnlock size={14} /> : <FiLock size={14} />}
              <span>{selectedElement.locked ? 'Unlock' : 'Lock'}</span>
            </button>
            <button
              onClick={handleDeleteSelected}
              title="Delete element"
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <FiTrash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}

        {/* Save snapshot controls - hidden for view-only users */}
        {!viewOnly && showSnapshotInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Snapshot description..."
              value={snapshotDesc}
              onChange={(e) => setSnapshotDesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveSnapshot()}
              className="text-sm border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500 w-48"
            />
            <button
              onClick={handleSaveSnapshot}
              className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setShowSnapshotInput(false)}
              className="text-xs px-2 py-1.5 text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
        ) : !viewOnly ? (
          <button
            onClick={() => setShowSnapshotInput(true)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
          >
            <FiCamera size={13} /> Snapshot
          </button>
        ) : null}
      </div>

      {/* Main drawing area: toolbar + canvas + properties panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left drawing toolbar */}
        <ElementToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          toolStyle={toolStyle}
          onStyleChange={(changes) => setToolStyle((prev) => ({ ...prev, ...changes }))}
          selectedElement={selectedElement}
          onDelete={handleDeleteSelected}
          onToggleLock={handleToggleLock}
          viewOnly={viewOnly}
        />

        {/* Canvas container - fills remaining space */}
        <div className="flex-1 relative overflow-hidden no-select">
          <canvas
            ref={canvasRef}
            style={{
              cursor: activeTool === 'SELECT' ? 'default' : 'crosshair',
              display: 'block',
              width: '100%',
              height: '100%',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}  // finalise shape if mouse leaves canvas
          />
        </div>

        {/* Right properties panel - only visible when an element is selected.
            key={selectedElement.id} forces a remount when a different element is
            selected, which resets the controlled form fields cleanly. */}
        {showProperties && selectedElement && (
          <ElementProperties
            key={selectedElement.id}
            element={selectedElement}
            onChange={handlePropertiesChange}
            onClose={() => setShowProperties(false)}
            onToggleLock={handleToggleLock}
            viewOnly={viewOnly}
          />
        )}
      </div>
    </div>
  )
}

// components/Elements/ElementToolbar.jsx
// Vertical toolbar on the left side of the whiteboard canvas.
// Provides buttons for each drawing tool (Select, Freehand, Rectangle,
// Ellipse, Text, Sticky Note) plus controls for stroke colour, fill colour,
// line width, and font size.
// The active tool is highlighted with a blue background.

import {
  FiMousePointer, FiEdit3, FiSquare, FiCircle,
  FiType, FiFileText, FiTrash2, FiLock, FiUnlock,
} from 'react-icons/fi'

// Drawing tool definitions - each maps to a tool ID and an icon
const TOOLS = [
  { id: 'SELECT',     icon: FiMousePointer, label: 'Select' },
  { id: 'FREEHAND',   icon: FiEdit3,        label: 'Freehand' },
  { id: 'SHAPE',      icon: FiSquare,       label: 'Rectangle' },
  { id: 'ELLIPSE',    icon: FiCircle,       label: 'Ellipse' },
  { id: 'TEXT',       icon: FiType,         label: 'Text' },
  { id: 'STICKY_NOTE',icon: FiFileText,     label: 'Sticky Note' },
]

/**
 * ElementToolbar
 * Left-side vertical toolbar for the whiteboard canvas.
 *
 * @param {object}   props
 * @param {string}   props.activeTool          - Currently selected tool ID
 * @param {function} props.onToolChange        - Called with new tool ID on selection
 * @param {object}   props.toolStyle           - Current style settings object
 * @param {function} props.onStyleChange       - Called with style property changes
 * @param {object}   [props.selectedElement]   - Currently selected canvas element
 * @param {function} props.onDelete            - Delete selected element
 * @param {function} props.onToggleLock        - Lock/unlock selected element
 */
export default function ElementToolbar({
  activeTool,
  onToolChange,
  toolStyle,
  onStyleChange,
  selectedElement,
  onDelete,
  onToggleLock,
  viewOnly = false,
}) {
  // In view-only mode, only show the Select tool
  const visibleTools = viewOnly ? TOOLS.filter((t) => t.id === 'SELECT') : TOOLS

  return (
    <div className="flex flex-col items-center gap-1 w-12 bg-white border-r border-slate-200 py-2 overflow-y-auto flex-shrink-0">
      {/* Drawing tool buttons */}
      {visibleTools.map(({ id, icon: Icon, label }) => {
        // For ELLIPSE tool we map back to SHAPE with ellipse sub-type
        const toolId = id === 'ELLIPSE' ? 'SHAPE' : id
        const isActive = activeTool === toolId && (id !== 'ELLIPSE' || toolStyle.shape === 'ELLIPSE')

        return (
          <button
            key={id}
            title={label}
            onClick={() => {
              if (id === 'ELLIPSE') {
                onToolChange('SHAPE')
                onStyleChange({ shape: 'ELLIPSE' })
              } else if (id === 'SHAPE') {
                onToolChange('SHAPE')
                onStyleChange({ shape: 'RECTANGLE' })
              } else {
                onToolChange(id)
              }
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors
              ${isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
          >
            <Icon size={16} />
          </button>
        )
      })}

      {/* Style controls - hidden for view-only users */}
      {!viewOnly && (
        <>
          {/* Divider */}
          <div className="w-8 border-t border-slate-200 my-1" />

          {/* Stroke colour picker */}
          <div title="Stroke colour" className="relative">
            <input
              type="color"
              value={toolStyle.strokeColor}
              onChange={(e) => onStyleChange({ strokeColor: e.target.value })}
              className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
              title="Stroke colour"
            />
            {/* Small label underneath */}
            <span className="text-[9px] text-slate-400 block text-center mt-0.5">Stroke</span>
          </div>

          {/* Fill colour picker */}
          <div title="Fill colour">
            <input
              type="color"
              value={toolStyle.fillColor === 'transparent' ? '#ffffff' : toolStyle.fillColor}
              onChange={(e) => onStyleChange({ fillColor: e.target.value })}
              className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
              title="Fill colour"
            />
            <span className="text-[9px] text-slate-400 block text-center mt-0.5">Fill</span>
          </div>

          {/* Line width slider */}
          <div className="flex flex-col items-center gap-0.5 mt-1" title="Line width">
            <input
              type="range"
              min={1}
              max={20}
              value={toolStyle.lineWidth}
              onChange={(e) => onStyleChange({ lineWidth: parseInt(e.target.value) })}
              className="w-8"
              style={{ writingMode: 'horizontal-tb' }}
              title={`Line width: ${toolStyle.lineWidth}px`}
            />
            <span className="text-[9px] text-slate-400">{toolStyle.lineWidth}px</span>
          </div>

          {/* Font size picker (relevant for TEXT and STICKY_NOTE tools) */}
          {(activeTool === 'TEXT' || activeTool === 'STICKY_NOTE') && (
            <div className="flex flex-col items-center gap-0.5 mt-1">
              <select
                value={toolStyle.fontSize}
                onChange={(e) => onStyleChange({ fontSize: parseInt(e.target.value) })}
                className="w-10 text-xs border border-slate-200 rounded text-center"
                title="Font size"
              >
                {[12, 14, 16, 18, 20, 24, 28, 32, 48].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="text-[9px] text-slate-400">Size</span>
            </div>
          )}
        </>
      )}

      {/* Element action buttons - only shown when an element is selected and not view-only */}
      {selectedElement && !viewOnly && (
        <>
          <div className="w-8 border-t border-slate-200 my-1" />

          {/* Lock / unlock toggle */}
          <button
            onClick={onToggleLock}
            title={selectedElement.locked ? 'Unlock' : 'Lock'}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            {selectedElement.locked ? <FiUnlock size={15} /> : <FiLock size={15} />}
          </button>

          {/* Delete selected element */}
          <button
            onClick={onDelete}
            title="Delete element"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <FiTrash2 size={15} />
          </button>
        </>
      )}
    </div>
  )
}

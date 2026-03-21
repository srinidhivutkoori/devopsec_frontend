// components/Elements/ElementProperties.jsx
// Right-side panel that shows editable properties for the currently selected
// whiteboard element.  All numeric fields validate that values are positive
// so the user cannot accidentally enter invalid positions or dimensions.
// Changes are persisted on blur (when the user finishes editing a field)
// rather than on every keystroke to avoid flooding the backend.

import { useState } from 'react'
import { FiX, FiLock, FiUnlock } from 'react-icons/fi'

/**
 * ElementProperties
 * Side panel for editing element metadata.
 * This component is mounted with key={element.id} from the parent (WhiteboardCanvas)
 * so React automatically unmounts and remounts it whenever a different element is
 * selected, giving us fresh state without needing a useEffect/setState reset pattern.
 *
 * @param {object}   props
 * @param {object}   props.element  - The selected canvas element
 * @param {function} props.onChange - Called with a partial update object
 * @param {function} props.onClose  - Called when the user closes the panel
 */
export default function ElementProperties({ element, onChange, onClose, onToggleLock, viewOnly = false }) {
  // Determine if the element is locked by another user (read-only for current user)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const lockedByOther = element.locked &&
    (element.lockedBy?.username || element.lockedBy) !== currentUser.username

  // Disable all editing if view-only or locked by another user
  const isDisabled = viewOnly || lockedByOther

  // Local copy of editable fields - updated by the user before being committed.
  // Initial values come from the element prop; the key={element.id} on the parent
  // ensures these are reset whenever the selected element changes.
  const [fields, setFields] = useState({
    x:       element.x       ?? 0,
    y:       element.y       ?? 0,
    width:   element.width   ?? 100,
    height:  element.height  ?? 100,
    content: element.content ?? '',
  })

  // Field-level validation errors - cleared when the user corrects a value
  const [errors, setErrors] = useState({})

  // Parse and validate a numeric field value
  const validateNumber = (name, value, min = 0) => {
    const num = parseFloat(value)
    if (isNaN(num)) return `${name} must be a number`
    if (num < min) return `${name} must be at least ${min}`
    return null
  }

  // Handle changes to text / number inputs
  const handleChange = (e) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))

    // Clear previous error for this field while the user is typing
    setErrors((prev) => ({ ...prev, [name]: null }))

    // For content fields, commit on every change so edits are not lost
    // when the panel is unmounted by clicking on the canvas
    if (name === 'content') {
      onChange({ content: value })
    }
  }

  // Commit a numeric field change on blur - validate before calling onChange
  const handleNumberBlur = (e) => {
    const { name, value } = e.target
    const min = name === 'width' || name === 'height' ? 1 : 0
    const err = validateNumber(name, value, min)
    if (err) {
      setErrors((prev) => ({ ...prev, [name]: err }))
      return
    }
    onChange({ [name]: parseFloat(value) })
  }

  // Commit text content changes on blur
  const handleContentBlur = () => {
    onChange({ content: fields.content })
  }

  // Helper for field border class
  const fieldClass = (name) =>
    `w-full px-2 py-1.5 text-sm border rounded outline-none transition-colors ${
      errors[name]
        ? 'border-red-400 bg-red-50'
        : 'border-slate-300 focus:border-blue-500'
    }`

  // Format element type for display
  const typeLabel = {
    SHAPE:        'Shape',
    TEXT:         'Text',
    STICKY_NOTE:  'Sticky Note',
    IMAGE:        'Image',
    FREEHAND:     'Freehand',
  }[element.type] || element.type

  return (
    // Fixed-width right panel
    <div className="w-60 bg-white border-l border-slate-200 flex flex-col flex-shrink-0 overflow-y-auto">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div>
          <p className="text-xs font-semibold text-slate-700">Element Properties</p>
          <p className="text-xs text-slate-400">{typeLabel}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <FiX size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Position fields */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Position</p>
          <div className="grid grid-cols-2 gap-2">
            {/* X position */}
            <div>
              <label className="block text-xs text-slate-600 mb-1">X</label>
              <input
                name="x"
                type="number"
                value={fields.x}
                onChange={handleChange}
                onBlur={handleNumberBlur}
                disabled={isDisabled}
                className={fieldClass('x')}
              />
              {errors.x && <p className="text-xs text-red-500 mt-0.5">{errors.x}</p>}
            </div>
            {/* Y position */}
            <div>
              <label className="block text-xs text-slate-600 mb-1">Y</label>
              <input
                name="y"
                type="number"
                value={fields.y}
                onChange={handleChange}
                onBlur={handleNumberBlur}
                disabled={isDisabled}
                className={fieldClass('y')}
              />
              {errors.y && <p className="text-xs text-red-500 mt-0.5">{errors.y}</p>}
            </div>
          </div>
        </div>

        {/* Size fields */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Size</p>
          <div className="grid grid-cols-2 gap-2">
            {/* Width */}
            <div>
              <label className="block text-xs text-slate-600 mb-1">Width</label>
              <input
                name="width"
                type="number"
                min={1}
                value={fields.width}
                onChange={handleChange}
                onBlur={handleNumberBlur}
                disabled={isDisabled}
                className={fieldClass('width')}
              />
              {errors.width && <p className="text-xs text-red-500 mt-0.5">{errors.width}</p>}
            </div>
            {/* Height */}
            <div>
              <label className="block text-xs text-slate-600 mb-1">Height</label>
              <input
                name="height"
                type="number"
                min={1}
                value={fields.height}
                onChange={handleChange}
                onBlur={handleNumberBlur}
                disabled={isDisabled}
                className={fieldClass('height')}
              />
              {errors.height && <p className="text-xs text-red-500 mt-0.5">{errors.height}</p>}
            </div>
          </div>
        </div>

        {/* Content field - for Text and Sticky Note elements */}
        {(element.type === 'TEXT' || element.type === 'STICKY_NOTE') && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Content</p>
            <textarea
              name="content"
              rows={4}
              value={fields.content}
              onChange={handleChange}
              onBlur={handleContentBlur}
              disabled={isDisabled}
              placeholder="Enter text..."
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded outline-none focus:border-blue-500 resize-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
          </div>
        )}

        {/* Lock status and toggle - hide toggle buttons for view-only users */}
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Lock Status</p>
          {viewOnly ? (
            <p className="text-xs text-slate-400">You have view-only access to this board.</p>
          ) : element.locked ? (
            <>
              <p className="text-xs text-amber-600">
                Locked by {element.lockedBy?.username || element.lockedBy || 'another user'}
              </p>
              <p className="text-xs text-slate-400">
                Other users cannot move or edit this element while it is locked.
              </p>
              {onToggleLock && (
                <button
                  onClick={onToggleLock}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <FiUnlock size={13} />
                  Click to Unlock
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-green-600">Unlocked</p>
              {onToggleLock && (
                <button
                  onClick={onToggleLock}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <FiLock size={13} />
                  Lock Element
                </button>
              )}
            </>
          )}
        </div>

        {/* Element ID (for debugging / reference) */}
        <p className="text-xs text-slate-300">ID: {element.id}</p>
      </div>
    </div>
  )
}

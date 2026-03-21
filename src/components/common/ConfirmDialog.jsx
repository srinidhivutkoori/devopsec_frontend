// components/common/ConfirmDialog.jsx
// Modal confirmation dialog used before destructive actions such as deleting
// a board, element, team, or permission entry.
// Renders a backdrop overlay and a centred card with title, message, and
// Cancel / Confirm buttons.  Clicking the backdrop also cancels the action.

import { FiAlertTriangle } from 'react-icons/fi'

/**
 * ConfirmDialog
 *
 * @param {object}   props
 * @param {boolean}  props.isOpen    - Whether the dialog is visible
 * @param {string}   props.title     - Dialog heading text
 * @param {string}   props.message   - Description of the action being confirmed
 * @param {function} props.onConfirm - Called when the user clicks Confirm
 * @param {function} props.onCancel  - Called when the user cancels or closes the dialog
 * @param {string}   [props.confirmLabel="Delete"] - Label for the confirm button
 * @param {string}   [props.confirmClass] - Extra Tailwind classes for the confirm button
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  confirmClass = 'bg-red-600 hover:bg-red-700',
}) {
  // Return nothing when the dialog is closed to keep the DOM clean
  if (!isOpen) return null

  return (
    // Semi-transparent backdrop covering the entire viewport
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}  // clicking outside the card cancels
    >
      {/* Dialog card - stop propagation so clicks inside don't close it */}
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon and title row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <FiAlertTriangle className="text-red-600" size={20} />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        </div>

        {/* Human-readable description of what will happen */}
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>

        {/* Action buttons - Cancel on the left, destructive action on the right */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

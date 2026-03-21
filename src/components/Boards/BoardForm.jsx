// components/Boards/BoardForm.jsx
// Modal form for creating and editing boards.
// Accepts an optional `board` prop for pre-populating fields in edit mode.
// Uses react-hook-form + yup so that inline validation errors are shown
// immediately when the user blurs a field or submits the form.
// Real-time validation feedback: errors appear beneath fields as soon as
// the value violates a rule, not just on final submit.

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { FiX } from 'react-icons/fi'
import { boardSchema } from '../../utils/validators'

/**
 * BoardForm
 * Create / edit board modal.
 *
 * @param {object}   props
 * @param {object}   [props.board]      - Existing board for edit mode (omit for create)
 * @param {function} props.onSubmit     - Called with validated form data
 * @param {function} props.onClose      - Called when the user cancels or closes
 * @param {boolean}  [props.isSubmitting] - Show loading state on the submit button
 */
export default function BoardForm({ board, onSubmit, onClose, isSubmitting = false }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(boardSchema),
    // mode: 'onChange' gives real-time validation as the user types
    mode: 'onChange',
    defaultValues: {
      name:            board?.name            ?? '',
      width:           board?.width           ?? 1200,
      height:          board?.height          ?? 800,
      backgroundColor: board?.backgroundColor ?? '#ffffff',
    },
  })

  // When the board prop changes (switching between create and edit), reset fields
  useEffect(() => {
    reset({
      name:            board?.name            ?? '',
      width:           board?.width           ?? 1200,
      height:          board?.height          ?? 800,
      backgroundColor: board?.backgroundColor ?? '#ffffff',
    })
  }, [board, reset])

  // Helper for consistent field border styling based on error state
  const inputClass = (hasError) =>
    `w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors ${
      hasError
        ? 'border-red-400 bg-red-50 focus:border-red-500'
        : 'border-slate-300 focus:border-blue-500'
    }`

  const isEditMode = !!board

  return (
    // Backdrop overlay - clicking outside closes the modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      {/* Form card - stop propagation so clicks inside don't close the modal */}
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEditMode ? 'Edit Board' : 'Create New Board'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Board name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Board Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="My Whiteboard"
              {...register('name')}
              className={inputClass(!!errors.name)}
            />
            {/* Inline error shown immediately when field violates schema */}
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Width and Height in a side-by-side row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Width (px) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={100}
                max={10000}
                {...register('width')}
                className={inputClass(!!errors.width)}
              />
              {errors.width && (
                <p className="mt-1 text-xs text-red-600">{errors.width.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Height (px) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={100}
                max={10000}
                {...register('height')}
                className={inputClass(!!errors.height)}
              />
              {errors.height && (
                <p className="mt-1 text-xs text-red-600">{errors.height.message}</p>
              )}
            </div>
          </div>

          {/* Background colour with a native colour picker + hex text input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Background Colour
            </label>
            <div className="flex items-center gap-2">
              {/* Native colour picker for mouse-friendly selection */}
              <input
                type="color"
                {...register('backgroundColor')}
                className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5"
              />
              {/* Hex text input so users can type an exact value */}
              <input
                type="text"
                placeholder="#ffffff"
                {...register('backgroundColor')}
                className={`flex-1 ${inputClass(!!errors.backgroundColor)}`}
              />
            </div>
            {errors.backgroundColor && (
              <p className="mt-1 text-xs text-red-600">{errors.backgroundColor.message}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Enter a 3 or 6 digit hex colour, e.g. #ffffff or #fff
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

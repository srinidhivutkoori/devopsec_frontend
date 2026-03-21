// components/Teams/TeamForm.jsx
// Modal form for creating and editing teams.
// Uses react-hook-form + yup validation so the name field shows an inline
// error as soon as the constraint is violated (required, max 200 chars).

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { FiX } from 'react-icons/fi'
import { teamSchema } from '../../utils/validators'

/**
 * TeamForm
 * Create / edit team modal.
 *
 * @param {object}   props
 * @param {object}   [props.team]        - Existing team for edit mode
 * @param {function} props.onSubmit      - Called with validated form data
 * @param {function} props.onClose       - Closes the modal
 * @param {boolean}  [props.isSubmitting]
 */
export default function TeamForm({ team, onSubmit, onClose, isSubmitting = false }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(teamSchema),
    mode: 'onChange',  // validate on every keystroke for real-time feedback
    defaultValues: { name: team?.name ?? '' },
  })

  // Sync form fields if the team prop changes (e.g. switching edit targets)
  useEffect(() => {
    reset({ name: team?.name ?? '' })
  }, [team, reset])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800">
            {team ? 'Edit Team' : 'Create Team'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Team name field */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Design Team"
              {...register('name')}
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors ${
                errors.name
                  ? 'border-red-400 bg-red-50 focus:border-red-500'
                  : 'border-slate-300 focus:border-blue-500'
              }`}
            />
            {/* Inline validation error */}
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : team ? 'Save Changes' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

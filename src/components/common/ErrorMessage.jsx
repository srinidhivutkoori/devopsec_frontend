// components/common/ErrorMessage.jsx
// Reusable error display component.
// Renders a styled red alert box with an icon and the provided message text.
// Used wherever an API call fails or a form has a top-level error that
// should be communicated to the user beyond inline field validation.

import { FiAlertCircle } from 'react-icons/fi'

/**
 * ErrorMessage
 * Displays an error notification in a styled red container.
 *
 * @param {object} props
 * @param {string} props.message - The error text to display
 * @param {string} [props.className] - Additional Tailwind classes for the wrapper
 */
export default function ErrorMessage({ message, className = '' }) {
  // Do not render anything if there is no message to show
  if (!message) return null

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 ${className}`}
      role="alert"
    >
      {/* Alert icon for visual emphasis */}
      <FiAlertCircle className="mt-0.5 flex-shrink-0 text-red-500" size={18} />
      {/* The actual error message - allow multi-line by using a paragraph */}
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  )
}

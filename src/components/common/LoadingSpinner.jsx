// components/common/LoadingSpinner.jsx
// Reusable full-area loading indicator.
// Renders a centred animated spinner with a "Loading..." label.
// Used by async data-fetching components while awaiting API responses
// so that the UI always provides feedback during slow network calls.

/**
 * LoadingSpinner
 * Displays a centred spinner animation.
 *
 * @param {object} props
 * @param {string} [props.message="Loading..."] - Text shown below the spinner
 * @param {string} [props.size="md"] - "sm" | "md" | "lg" controls spinner diameter
 */
export default function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  // Map size prop to Tailwind dimension classes
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  }

  const spinnerClass = sizeClasses[size] || sizeClasses.md

  return (
    // Centred flex container - fills available height in any parent
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
      {/* Animated circular spinner using Tailwind's animate-spin utility */}
      <div
        className={`${spinnerClass} rounded-full border-blue-200 border-t-blue-600 animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {/* Descriptive text below the spinner for accessibility */}
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

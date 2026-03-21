// utils/dateUtils.js
// Date / time formatting helpers used throughout the application.
// Centralising these functions prevents scattered inline date logic and makes
// it easy to swap the underlying library (e.g. date-fns) later if needed.

/**
 * Formats a date string or Date object into a human-readable absolute date/time.
 * Example output: "14 Mar 2026, 15:42"
 *
 * @param {string|Date} dateInput - ISO string or Date object
 * @returns {string} Formatted date string, or "N/A" for invalid input
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return 'N/A'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return 'N/A'

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formats a date string or Date object into a short date (no time).
 * Example output: "14 Mar 2026"
 *
 * @param {string|Date} dateInput - ISO string or Date object
 * @returns {string} Formatted date string, or "N/A" for invalid input
 */
export function formatDate(dateInput) {
  if (!dateInput) return 'N/A'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return 'N/A'

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Returns a relative time string such as "2 hours ago" or "just now".
 * Useful for showing when a snapshot was created or when a board was last updated.
 *
 * @param {string|Date} dateInput - ISO string or Date object
 * @returns {string} Relative time description
 */
export function timeAgo(dateInput) {
  if (!dateInput) return 'N/A'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return 'N/A'

  const now = new Date()
  // Difference in seconds between now and the given date
  const diffSeconds = Math.floor((now - date) / 1000)

  if (diffSeconds < 5) return 'just now'
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`

  const diffYears = Math.floor(diffMonths / 12)
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`
}

/**
 * Converts a Date or ISO string to an ISO date string (YYYY-MM-DD).
 * Useful for input[type="date"] default values.
 *
 * @param {string|Date} dateInput
 * @returns {string} YYYY-MM-DD or empty string
 */
export function toISODate(dateInput) {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

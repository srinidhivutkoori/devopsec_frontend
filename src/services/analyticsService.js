// services/analyticsService.js
// API calls for the analytics endpoints.
// Collaboration patterns show historical activity (e.g. edits per hour) while
// usage prediction provides a ML-generated forecast for upcoming board activity.
// Both responses are returned raw so the chart components can shape them as needed.

import api from './api'

/**
 * Fetch collaboration pattern data - typically an array of hourly or daily
 * activity counts used to render line/bar charts showing when the team is
 * most active on boards.
 *
 * @returns {Promise<CollaborationPattern>} Backend-defined shape (mapped in component)
 */
export async function getCollaborationPatterns() {
  const response = await api.get('/analytics/collaboration-patterns')
  return response.data
}

/**
 * Fetch usage prediction data - a forecast of how many board interactions are
 * expected over the next 7 or 30 days, typically including a trend direction
 * and a confidence interval.
 *
 * @returns {Promise<UsagePrediction>} Backend-defined shape (mapped in component)
 */
export async function getUsagePrediction() {
  const response = await api.get('/analytics/usage-prediction')
  return response.data
}

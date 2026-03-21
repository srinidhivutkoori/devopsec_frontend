import api from './api'

/**
 * Fetch recent activity across all boards.
 * @param {number} limit max entries to return
 */
export async function getRecentActivity(limit = 50) {
  const response = await api.get('/activity', { params: { limit } })
  return response.data
}

/**
 * Fetch recent activity for a specific board.
 */
export async function getBoardActivity(boardId, limit = 30) {
  const response = await api.get(`/activity/board/${boardId}`, { params: { limit } })
  return response.data
}

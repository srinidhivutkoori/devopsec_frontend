// services/snapshotService.js
// API calls for VersionSnapshot entities.
// Snapshots capture the full state of a board (all element positions, content,
// and styles) at a specific point in time, enabling version history and replay.
// The snapshot data (JSON) is stored by the backend and returned here as-is
// so the SnapshotReplay component can reconstruct the canvas state.

import api from './api'

/**
 * Constructs the snapshots URL for a board.
 * @param {string|number} boardId
 */
const snapshotsUrl = (boardId) => `/boards/${boardId}/snapshots`

/**
 * Fetch all snapshots for a board, ordered by creation time descending.
 * @param {string|number} boardId
 * @returns {Promise<VersionSnapshot[]>}
 */
export async function getSnapshotsByBoard(boardId) {
  const response = await api.get(snapshotsUrl(boardId))
  return response.data
}

/**
 * Fetch a specific snapshot by ID (used during replay navigation).
 * @param {string|number} boardId
 * @param {string|number} snapshotId
 * @returns {Promise<VersionSnapshot>}
 */
export async function getSnapshotById(boardId, snapshotId) {
  const response = await api.get(`${snapshotsUrl(boardId)}/${snapshotId}`)
  return response.data
}

/**
 * Create a new snapshot capturing the current board state.
 * The backend serialises all current elements into the snapshotData JSON field.
 * @param {string|number} boardId
 * @param {{ description: string }} snapshotData
 * @returns {Promise<VersionSnapshot>} The newly created snapshot
 */
export async function createSnapshot(boardId, snapshotData) {
  const response = await api.post(snapshotsUrl(boardId), snapshotData)
  return response.data
}

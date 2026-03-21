// services/boardService.js
// All API calls related to Board entities.
// Each function wraps an Axios call and returns the response data directly
// so components only need to deal with the actual payload, not the full
// Axios response object.

import api from './api'

const BOARDS_ENDPOINT = '/boards'

/**
 * Fetch all boards visible to the current user.
 * @returns {Promise<Board[]>} Array of board objects
 */
export async function getAllBoards() {
  const response = await api.get(BOARDS_ENDPOINT)
  return response.data
}

/**
 * Fetch only the boards owned by or shared with the current user.
 * Maps to GET /api/boards (backend filters by current user automatically).
 */
export async function getMyBoards() {
  const response = await api.get(BOARDS_ENDPOINT)
  return response.data
}

/**
 * Fetch a single board by its ID.
 * @param {string|number} boardId
 * @returns {Promise<Board>}
 */
export async function getBoardById(boardId) {
  const response = await api.get(`${BOARDS_ENDPOINT}/${boardId}`)
  return response.data
}

/**
 * Create a new board.
 * @param {{ name: string, width: number, height: number, backgroundColor: string }} boardData
 * @returns {Promise<Board>} The newly created board
 */
export async function createBoard(boardData) {
  const response = await api.post(BOARDS_ENDPOINT, boardData)
  return response.data
}

/**
 * Update an existing board's metadata (name, dimensions, background colour).
 * @param {string|number} boardId
 * @param {Partial<Board>} boardData
 * @returns {Promise<Board>} The updated board
 */
export async function updateBoard(boardId, boardData) {
  const response = await api.put(`${BOARDS_ENDPOINT}/${boardId}`, boardData)
  return response.data
}

/**
 * Delete a board permanently.
 * @param {string|number} boardId
 * @returns {Promise<void>}
 */
export async function deleteBoard(boardId) {
  await api.delete(`${BOARDS_ENDPOINT}/${boardId}`)
}

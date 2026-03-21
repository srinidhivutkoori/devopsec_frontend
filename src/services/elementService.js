// services/elementService.js
// API calls for Element entities that belong to a specific board.
// Elements represent the drawable objects on the whiteboard canvas
// (shapes, text, sticky notes, freehand paths, images).
// Lock / unlock endpoints are included to support real-time collaboration -
// when a user selects an element they lock it so others cannot simultaneously
// edit it.

import api from './api'

/**
 * Constructs the base URL for elements belonging to a particular board.
 * @param {string|number} boardId
 */
const elementsUrl = (boardId) => `/boards/${boardId}/elements`

/**
 * Fetch all elements for a given board.
 * @param {string|number} boardId
 * @returns {Promise<Element[]>}
 */
export async function getElementsByBoard(boardId) {
  const response = await api.get(elementsUrl(boardId))
  return response.data
}

/**
 * Fetch a single element by its ID.
 * @param {string|number} boardId
 * @param {string|number} elementId
 * @returns {Promise<Element>}
 */
export async function getElementById(boardId, elementId) {
  const response = await api.get(`${elementsUrl(boardId)}/${elementId}`)
  return response.data
}

/**
 * Create a new element on the whiteboard.
 * @param {string|number} boardId
 * @param {{ type: string, x: number, y: number, width: number, height: number, content: string, style: object }} elementData
 * @returns {Promise<Element>} The created element with server-assigned ID
 */
export async function createElement(boardId, elementData) {
  const response = await api.post(elementsUrl(boardId), elementData)
  return response.data
}

/**
 * Update an existing element (position, size, content, style, zIndex, etc.).
 * @param {string|number} boardId
 * @param {string|number} elementId
 * @param {Partial<Element>} elementData
 * @returns {Promise<Element>} The updated element
 */
export async function updateElement(boardId, elementId, elementData) {
  const response = await api.put(`${elementsUrl(boardId)}/${elementId}`, elementData)
  return response.data
}

/**
 * Delete an element from the board.
 * @param {string|number} boardId
 * @param {string|number} elementId
 * @returns {Promise<void>}
 */
export async function deleteElement(boardId, elementId) {
  await api.delete(`${elementsUrl(boardId)}/${elementId}`)
}

/**
 * Lock an element so that other collaborators cannot edit it concurrently.
 * The backend associates the lock with the current user's JWT identity.
 * @param {string|number} boardId
 * @param {string|number} elementId
 * @returns {Promise<Element>} Element with locked=true and lockedBy set
 */
export async function lockElement(boardId, elementId) {
  const response = await api.put(`${elementsUrl(boardId)}/${elementId}/lock`)
  return response.data
}

/**
 * Release the lock on an element, allowing others to edit it.
 * @param {string|number} boardId
 * @param {string|number} elementId
 * @returns {Promise<Element>} Element with locked=false
 */
export async function unlockElement(boardId, elementId) {
  const response = await api.put(`${elementsUrl(boardId)}/${elementId}/unlock`)
  return response.data
}

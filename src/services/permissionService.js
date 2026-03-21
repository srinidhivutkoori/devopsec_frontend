// services/permissionService.js
// API calls for AccessPermission entities.
// Permissions control who can view, edit, or administer a specific board.
// Permissions can be granted to individual users or entire teams, with three
// levels: VIEW (read-only), EDIT (draw and modify), ADMIN (full control).

import api from './api'

/**
 * Constructs the permissions URL for a board.
 * @param {string|number} boardId
 */
const permissionsUrl = (boardId) => `/boards/${boardId}/permissions`

/**
 * Fetch all permissions for a given board.
 * @param {string|number} boardId
 * @returns {Promise<AccessPermission[]>}
 */
export async function getPermissionsByBoard(boardId) {
  const response = await api.get(permissionsUrl(boardId))
  return response.data
}

/**
 * Grant a new permission on a board to a user or team.
 * @param {string|number} boardId
 * @param {{ userId?: number, teamId?: number, permissionLevel: string }} permissionData
 * @returns {Promise<AccessPermission>}
 */
export async function createPermission(boardId, permissionData) {
  const response = await api.post(permissionsUrl(boardId), permissionData)
  return response.data
}

/**
 * Update an existing permission's level (e.g. VIEW -> EDIT).
 * @param {string|number} boardId
 * @param {string|number} permissionId
 * @param {{ permissionLevel: string }} permissionData
 * @returns {Promise<AccessPermission>}
 */
export async function updatePermission(boardId, permissionId, permissionData) {
  const response = await api.put(
    `${permissionsUrl(boardId)}/${permissionId}`,
    permissionData
  )
  return response.data
}

/**
 * Revoke a permission from a board.
 * @param {string|number} boardId
 * @param {string|number} permissionId
 * @returns {Promise<void>}
 */
export async function deletePermission(boardId, permissionId) {
  await api.delete(`${permissionsUrl(boardId)}/${permissionId}`)
}

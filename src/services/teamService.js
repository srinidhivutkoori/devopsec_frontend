// services/teamService.js
// API calls for Team entities and team membership management.
// Teams allow groups of users to be granted board permissions collectively
// rather than on a per-user basis, which simplifies access control for
// larger organisations.

import api from './api'

const TEAMS_ENDPOINT = '/teams'

/**
 * Fetch all teams the current user can see.
 * @returns {Promise<Team[]>}
 */
export async function getAllTeams() {
  const response = await api.get(TEAMS_ENDPOINT)
  return response.data
}

/**
 * Fetch a single team along with its member list.
 * @param {string|number} teamId
 * @returns {Promise<Team>}
 */
export async function getTeamById(teamId) {
  const response = await api.get(`${TEAMS_ENDPOINT}/${teamId}`)
  return response.data
}

/**
 * Create a new team.
 * @param {{ name: string }} teamData
 * @returns {Promise<Team>}
 */
export async function createTeam(teamData) {
  const response = await api.post(TEAMS_ENDPOINT, teamData)
  return response.data
}

/**
 * Update a team's name.
 * @param {string|number} teamId
 * @param {{ name: string }} teamData
 * @returns {Promise<Team>}
 */
export async function updateTeam(teamId, teamData) {
  const response = await api.put(`${TEAMS_ENDPOINT}/${teamId}`, teamData)
  return response.data
}

/**
 * Delete a team.  This does not delete the users in the team.
 * @param {string|number} teamId
 * @returns {Promise<void>}
 */
export async function deleteTeam(teamId) {
  await api.delete(`${TEAMS_ENDPOINT}/${teamId}`)
}

/**
 * Add a user to a team by their username.
 * @param {string|number} teamId
 * @param {string} username
 * @returns {Promise<Team>} Updated team with new member included
 */
export async function addMember(teamId, username) {
  const response = await api.post(`${TEAMS_ENDPOINT}/${teamId}/members`, { username })
  return response.data
}

/**
 * Remove a user from a team.
 * @param {string|number} teamId
 * @param {string|number} userId
 * @returns {Promise<void>}
 */
export async function removeMember(teamId, userId) {
  await api.delete(`${TEAMS_ENDPOINT}/${teamId}/members/${userId}`)
}

/**
 * Leave a team (current user removes themselves).
 * @param {string|number} teamId
 * @returns {Promise<Team>} Updated team
 */
export async function leaveTeam(teamId) {
  const response = await api.post(`${TEAMS_ENDPOINT}/${teamId}/leave`)
  return response.data
}

// services/websocketService.js
// WebSocket service using STOMP over SockJS.
// This service manages a single shared STOMP client so the whole application
// can subscribe to board topics through one persistent connection.
// The whiteboard canvas uses this service to receive real-time element
// create/update/delete events broadcast by the backend when any collaborator
// makes a change.

import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

// Backend WebSocket endpoint (SockJS endpoint registered in Spring)
// In production, VITE_WS_URL is set during the CI/CD build step.
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:10001/ws'

// Module-level STOMP client instance - reused across the session
let stompClient = null

// Track active topic subscriptions so we can unsubscribe cleanly
const subscriptions = {}

/**
 * Connect to the STOMP broker.
 * Resolves when the connection is established.
 * If already connected, resolves immediately to avoid duplicate connections.
 *
 * @param {string} token - JWT token to send as a STOMP CONNECT header
 * @returns {Promise<void>}
 */
export function connect(token) {
  return new Promise((resolve, reject) => {
    // Avoid creating a second client if already connected
    if (stompClient && stompClient.connected) {
      resolve()
      return
    }

    stompClient = new Client({
      // SockJS factory - falls back to HTTP long-polling if WebSocket is blocked
      webSocketFactory: () => new SockJS(WS_URL),

      // Pass the JWT so the backend can authenticate the STOMP connection
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      // Attempt reconnection every 5 seconds if the connection drops
      reconnectDelay: 5000,

      onConnect: () => {
        resolve()
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame)
        reject(new Error(frame.headers?.message || 'STOMP connection error'))
      },

      onDisconnect: () => {
        // Log disconnect for debugging - not an error in normal shutdown
      },
    })

    stompClient.activate()
  })
}

/**
 * Gracefully disconnect from the STOMP broker.
 * Clears all tracked subscriptions before deactivating.
 */
export function disconnect() {
  // Unsubscribe from all active topic subscriptions first
  Object.values(subscriptions).forEach((sub) => {
    try {
      sub.unsubscribe()
    } catch (_e) {
      // Ignore errors during cleanup
    }
  })

  // Clear the subscription registry
  Object.keys(subscriptions).forEach((key) => delete subscriptions[key])

  if (stompClient) {
    stompClient.deactivate()
    stompClient = null
  }
}

/**
 * Subscribe to real-time updates for a specific board.
 * Messages sent to /topic/boards/{boardId} by the backend are delivered
 * to the provided callback as parsed JavaScript objects.
 *
 * @param {string|number} boardId - The board to subscribe to
 * @param {function} onMessage - Callback receiving the parsed message body
 * @returns {string} subscriptionKey - Use this to unsubscribe later
 */
export function subscribeToBoardUpdates(boardId, onMessage) {
  if (!stompClient || !stompClient.connected) {
    console.warn('WebSocket not connected - cannot subscribe to board:', boardId)
    return null
  }

  const topic = `/topic/boards/${boardId}`
  const subscriptionKey = `board-${boardId}`

  // Avoid duplicate subscriptions for the same board
  if (subscriptions[subscriptionKey]) {
    return subscriptionKey
  }

  const subscription = stompClient.subscribe(topic, (message) => {
    try {
      // Parse the JSON payload sent by the backend
      const data = JSON.parse(message.body)
      onMessage(data)
    } catch (_e) {
      console.warn('Failed to parse WebSocket message:', message.body)
    }
  })

  // Store so we can unsubscribe when the canvas unmounts
  subscriptions[subscriptionKey] = subscription
  return subscriptionKey
}

/**
 * Unsubscribe from a board's real-time topic.
 * Called when the whiteboard canvas component unmounts.
 *
 * @param {string} subscriptionKey - Key returned by subscribeToBoardUpdates
 */
export function unsubscribeFromBoard(subscriptionKey) {
  if (subscriptions[subscriptionKey]) {
    subscriptions[subscriptionKey].unsubscribe()
    delete subscriptions[subscriptionKey]
  }
}

/**
 * Publish an element change event to the board topic.
 * Used by the canvas to broadcast local changes to other collaborators.
 *
 * @param {string|number} boardId
 * @param {{ action: string, element: object }} payload
 *   action: 'CREATE' | 'UPDATE' | 'DELETE'
 */
export function sendElementUpdate(boardId, payload) {
  if (!stompClient || !stompClient.connected) {
    return
  }
  stompClient.publish({
    destination: `/app/boards/${boardId}/elements`,
    body: JSON.stringify(payload),
  })
}

/**
 * Returns whether the STOMP client is currently connected.
 * @returns {boolean}
 */
export function isConnected() {
  return !!(stompClient && stompClient.connected)
}

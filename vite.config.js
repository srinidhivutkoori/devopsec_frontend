// vite.config.js
// Vite build configuration for the Real-Time Collaborative Whiteboard frontend.
// Registers the React plugin and the Tailwind CSS Vite plugin, and sets the
// dev server to port 5173 (default Vite port kept explicit for clarity).

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    // React fast-refresh and JSX transform
    react(),
    // Tailwind CSS v4 first-class Vite integration (no postcss config needed)
    tailwindcss(),
  ],
  server: {
    port: 10002,
  },
  define: {
    // SockJS requires `global` which is not defined in browser/ESM environments
    global: 'globalThis',
  },
})

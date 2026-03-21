// main.jsx
// Application entry point.
// Mounts the React application into the #root div defined in index.html.
// BrowserRouter is provided here so React Router hooks (useNavigate,
// useLocation, NavLink) are available throughout the entire component tree.
// StrictMode is enabled in development to detect potential issues with
// side-effects and deprecated API usage.
// react-toastify CSS is imported here (once, globally) so toast notifications
// have their default styling regardless of which component calls toast().

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

// Tailwind CSS entry point (processed by @tailwindcss/vite)
import './index.css'

// React Toastify default styles - must be imported before the App renders
import 'react-toastify/dist/ReactToastify.css'

import App from './App.jsx'

// Mount the application inside StrictMode for development safety checks
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* HashRouter is used so S3 static hosting can serve the SPA correctly */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)

import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// The admin panel is only for staff, so keep it out of the public bundle.
// eslint-disable-next-line react-refresh/only-export-components -- entry file, never hot-reloaded as a module
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

const isAdmin = window.location.hash === '#admin' || window.location.hash.startsWith('#admin/')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? <Suspense fallback={null}><AdminApp /></Suspense> : <App />}
  </StrictMode>,
)

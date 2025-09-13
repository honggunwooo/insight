import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// --- Auto theme detection (system/light/dark) with live updates ---
// Uses `localStorage.theme`:
// - 'light'  -> force light
// - 'dark'   -> force dark
// - 'system' or missing -> follow OS setting

function getStoredTheme() {
  try {
    return localStorage.getItem('theme') || 'system'
  } catch {
    return 'system'
  }
}

function applyTheme(mode) {
  const root = document.documentElement
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const effective = mode === 'system' ? (mql.matches ? 'dark' : 'light') : mode
  root.setAttribute('data-theme', effective)
  // Help native controls (scrollbars, form controls) match
  root.style.colorScheme = effective
}

function initTheme() {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  let stored = getStoredTheme()
  applyTheme(stored)

  // Re-apply when OS theme changes and user follows system
  const onChange = () => {
    stored = getStoredTheme()
    if (stored === 'system') applyTheme('system')
  }
  try {
    mql.addEventListener('change', onChange)
  } catch {
    // Safari < 14 fallback
    mql.addListener?.(onChange)
  }

  // Optional: expose setter for future toggles
  window.setTheme = (mode) => {
    try { localStorage.setItem('theme', mode) } catch {}
    applyTheme(mode)
  }
}

// Apply theme ASAP to avoid FOUC, then mount React
initTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

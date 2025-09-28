import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ✅ Add Buffer polyfill
import { Buffer } from 'buffer'

// Extend the Window interface to include Buffer
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

window.Buffer = Buffer

createRoot(document.getElementById('root')!).render(
    <App />
)

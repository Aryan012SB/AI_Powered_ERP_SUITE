import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErpProvider } from './context/ErpContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErpProvider>
      <App />
    </ErpProvider>
  </StrictMode>,
)

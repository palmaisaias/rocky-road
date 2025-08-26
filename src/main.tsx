import React from 'react'
import ReactDOM from 'react-dom/client'

// Bootstrap CSS only (no JS needed)
import 'bootstrap/dist/css/bootstrap.min.css'

import './styles/global.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
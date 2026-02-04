// src/main.jsx - REMOVE React.StrictMode temporarily
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'antd/dist/reset.css';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // Remove React.StrictMode for now:
  <App />
)

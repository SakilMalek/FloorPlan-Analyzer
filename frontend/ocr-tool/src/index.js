// frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // This imports your Tailwind CSS styles
import App from './App'; // This imports your main floorplan analyzer App component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
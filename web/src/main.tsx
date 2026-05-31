import React from 'react';
import ReactDOM from 'react-dom/client';

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

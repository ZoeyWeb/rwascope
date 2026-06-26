import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}
import './i18n';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </Suspense>
  </React.StrictMode>
);

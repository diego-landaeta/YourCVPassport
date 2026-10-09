import './index.css';
import './src/print-styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/* ── Register Service Worker for push notifications ──────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
  });
}

// nginx sirve las páginas con título propio desde carpetas (dist/login/index.html,
// dist/precios/index.html...) y redirige /login a /login/. Las rutas de la app se
// comparan sin barra final (p. ej. AuthScreen mira pathname === '/login'), así que
// se quita antes de montar React. Sin recarga: solo cambia la URL.
if (window.location.pathname.length > 1 && window.location.pathname.endsWith('/')) {
  const { pathname, search, hash } = window.location;
  window.history.replaceState(window.history.state, '', pathname.replace(/\/+$/, '') + search + hash);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

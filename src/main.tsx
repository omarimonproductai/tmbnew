import React from 'react';
import ReactDOM from 'react-dom/client';
// Order matters: expose Leaflet as `window.L` BEFORE leaflet-rotate
// runs its module-level side effects, since the plugin assumes the
// global is already wired up.
import './leafletGlobals';
import 'leaflet-rotate';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

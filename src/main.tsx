import React from 'react';
import ReactDOM from 'react-dom/client';
// leaflet-rotate must be imported once globally before any MapContainer
// is mounted; it patches Leaflet to support the rotate / touchRotate
// options on the map.
import 'leaflet-rotate';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// src/main.tsx
import React from 'react'; // cite: uploaded:skenlrd/value-scout-01/value-scout-01-9fd8941135f1664bf7924859e0fcbff55af81bab/src/main.tsx
import ReactDOM from 'react-dom/client'; // cite: uploaded:skenlrd/value-scout-01/value-scout-01-9fd8941135f1664bf7924859e0fcbff55af81bab/src/main.tsx
import App from './App.tsx'; // cite: uploaded:skenlrd/value-scout-01/value-scout-01-9fd8941135f1664bf7924859e0fcbff55af81bab/src/main.tsx
import './index.css'; // cite: uploaded:skenlrd/value-scout-01/value-scout-01-9fd8941135f1664bf7924859e0fcbff55af81bab/src/main.tsx

ReactDOM.createRoot(document.getElementById('root')!).render( // cite: uploaded:skenlrd/value-scout-01/value-scout-01-9fd8941135f1664bf7924859e0fcbff55af81bab/src/main.tsx
  <React.StrictMode> 
    <App /> 
  </React.StrictMode>, // cite: uploaded:skenlrd/value-scout-01/value-scout-01-9fd8941135f1664bf7924859e0fcbff55af81bab/src/main.tsx
)
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// 1. Import Microsoft Graph Toolkit (MGT)
import { Providers } from '@microsoft/mgt-element';
import { Msal2Provider } from '@microsoft/mgt-msal2-provider';

// 2. Initialize the Provider with your Azure Keys
Providers.globalProvider = new Msal2Provider({
  clientId: 'eae3d7e6-65d3-4ae5-85be-ff59f407ef27', // From Azure Overview
  authority: 'https://login.microsoftonline.com/d4dc6f8a-780d-4900-b321-58080d6bdf79', // From Azure Overview
  scopes: ['Files.Read.All', 'Sites.Read.All', 'User.Read'],
  redirectUri: window.location.origin // Automatically detects localhost or firebase URL
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
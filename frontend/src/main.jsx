import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './styles/style.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <App />
      <Toaster
        position="bottom-center"
        toastOptions={{
          // react-hot-toast sets inline styles, so these need Tailwind's
          // important modifier (!) to win.
          className: 'rounded-full! px-5! text-sm! shadow-lg!',
        }}
      />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

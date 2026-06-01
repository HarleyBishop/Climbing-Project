import React from 'react'
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx'
import "./styles/style.css";

// GoogleOAuthProvider wraps the entire app so the Google OAuth context is
// available to any component that calls useGoogleLogin(). It needs the
// client ID at this level because it initialises the Google Identity Services
// script once for the whole app. The client ID is safe to expose in the
// frontend — it's not a secret; the actual auth happens server-side via
// the access_token exchange in GoogleLoginView.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

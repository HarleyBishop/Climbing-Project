import React, { useState } from 'react'
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx'
import "./styles/style.css";
import { ThemeContext, ThemeToggleContext, THEMES, MEADOW } from './theme';

function Root() {
  // Persist the user's theme choice across sessions.
  const [themeKey, setThemeKey] = useState(
    () => localStorage.getItem('bb-theme') || 'meadow'
  );

  const palette = THEMES[themeKey] || MEADOW;

  const toggleTheme = () => {
    const next = themeKey === 'meadow' ? 'dusk' : 'meadow';
    setThemeKey(next);
    localStorage.setItem('bb-theme', next);
  };

  return (
    <ThemeContext.Provider value={palette}>
      <ThemeToggleContext.Provider value={toggleTheme}>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
          <App />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                fontFamily: '"Mulish", system-ui, sans-serif',
                fontSize: '13.5px',
                background: palette.card,
                color: palette.ink,
                border: `1px solid ${palette.line}`,
                borderRadius: '12px',
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#bb5b46',
                  border: '1px solid #f5c0b0',
                },
              },
              success: {
                style: {
                  background: palette.goodBg,
                  color: palette.good,
                  border: `1px solid ${palette.good}55`,
                },
              },
            }}
          />
        </GoogleOAuthProvider>
      </ThemeToggleContext.Provider>
    </ThemeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

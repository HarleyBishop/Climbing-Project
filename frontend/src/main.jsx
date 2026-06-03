import React, { useState } from 'react'
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx'
import "./styles/style.css";
import { ThemeContext, ThemeToggleContext, THEMES, MEADOW } from './theme';

function Root() {
  const [themeKey, setThemeKey] = useState(() => {
    const saved = localStorage.getItem('bb-theme') || 'meadow';
    document.documentElement.dataset.theme = saved;
    return saved;
  });

  const palette = THEMES[themeKey] || MEADOW;

  const toggleTheme = () => {
    const next = themeKey === 'meadow' ? 'dusk' : 'meadow';
    setThemeKey(next);
    localStorage.setItem('bb-theme', next);
    document.documentElement.dataset.theme = next;
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
                fontFamily: 'var(--font-body)',
                fontSize: '13.5px',
                background: 'var(--card)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
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
                  background: 'var(--good-bg)',
                  color: 'var(--good)',
                  border: '1px solid color-mix(in srgb, var(--good) 33%, transparent)',
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

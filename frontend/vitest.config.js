import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Separate vitest config so the PWA/Tailwind plugins from vite.config.js
// don't interfere with the test runner (they're irrelevant in a test environment).
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom gives tests a browser-like environment with localStorage, document, etc.
    environment: 'jsdom',
    // Makes describe/it/expect available globally without importing from 'vitest'.
    globals: true,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // autoUpdate silently installs new service workers as soon as they're
      // available, so users always get the latest version without a prompt.
      devOptions: {
        enabled: true,
      },
      workbox: {
        // Cache the app shell and all static assets on first load.
        globPatterns: ["**/*.{js,css,html,ico,svg,jpg,png,woff2}"],
        // API calls must always be fresh — never serve from cache.
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: "NetworkOnly",
          },
          // OpenStreetMap tiles — cache for 30 days so the map works offline
          // for tiles the user has already viewed.
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\//,
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      manifest: {
        name: "Beta Board",
        short_name: "Beta Board",
        description: "Track your climbing sends, compete at your gym, and rank up.",
        theme_color: "#78350f",
        background_color: "#fff7ed",
        display: "standalone",
        // standalone removes the browser chrome so it feels like a native app.
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "pwa-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    // Allow Cursor's forwarded preview hostnames to reach the dev server.
    allowedHosts: true,
    // Same-origin API: the browser only needs the frontend port; /api is
    // proxied to the Hono worker. This makes the app work through a single
    // forwarded port on a remote dev VM (no cross-origin 127.0.0.1 calls).
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
});

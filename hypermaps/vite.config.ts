
import path from 'node:path';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    host: true,   // 0.0.0.0 – accessible from host
    port: 5173,   // optional, keeps the familiar port
  },
});
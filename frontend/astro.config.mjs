import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';
const hmrClientPort = process.env.HMR_CLIENT_PORT
  ? Number(process.env.HMR_CLIENT_PORT)
  : undefined;
const usePolling = process.env.CHOKIDAR_USEPOLLING === 'true';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: true,
      watch: usePolling ? { usePolling: true, interval: 300 } : undefined,
      hmr: hmrClientPort ? { clientPort: hmrClientPort } : undefined,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    drop: ['console'],
  },
  build: {
    assetsDir: 'static',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React ecosystem — rarely changes, great for long-term caching
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor/react';
          }
          if (
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/@remix-run')
          ) {
            return 'vendor/router';
          }
          // recharts is heavy (~200KB+) and only used in a few pages
          if (
            id.includes('node_modules/recharts') ||
            id.includes('node_modules/d3-')
          ) {
            return 'vendor/recharts';
          }
          // @react-pdf/renderer is heavy but already dynamically imported
          if (id.includes('node_modules/@react-pdf')) {
            return 'vendor/pdf';
          }
        },
      },
    },
  },
});

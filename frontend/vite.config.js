import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/agenda': 'http://localhost:5037',
      '/mentors': 'http://localhost:5037',
      '/bookings': 'http://localhost:5037',
      '/goals': 'http://localhost:5037',
      '/school-targets': 'http://localhost:5037',
      '/profiles': 'http://localhost:5037',
    },
  },
  build: {
    outDir: '../backend/GuidedUp.Api/wwwroot',
    emptyOutDir: true,
  },
});

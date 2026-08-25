import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// TODO: add path aliases (@core, @components, @stores) once the module structure stabilizes.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});

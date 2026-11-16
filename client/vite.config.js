import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // For `npm run dev`: send /api calls to the Express server on port 5000.
  server: { proxy: { '/api': 'http://localhost:5000' } },
});

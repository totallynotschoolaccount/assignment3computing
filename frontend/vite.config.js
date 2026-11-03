import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // always use 5173, because the back end will only accept requests from this address
    strictPort: true,
  },
});
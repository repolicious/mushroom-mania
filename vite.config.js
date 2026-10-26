import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base: the same build works at a domain root or under any subpath.
  base: './',
  plugins: [react()],
});

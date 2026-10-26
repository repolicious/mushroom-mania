import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base: the same build works at a domain root or under any subpath.
  base: './',
  plugins: [react()],
  build: {
    // Vite's default target starts at Safari/iOS 16.4. Build for iOS 15 and up
    // instead: older Safari ignores range media queries like (width<=575.98px),
    // and this keeps the CSS on min-/max-width (cssTarget follows target).
    target: ['chrome111', 'edge111', 'firefox114', 'safari15', 'ios15'],
    rolldownOptions: {
      input: {
        main: 'index.html',
        mania: 'mania/index.html',
      },
    },
  },
});

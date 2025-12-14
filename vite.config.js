import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      external: ['@mediapipe/hands', '@mediapipe/camera_utils']
    }
  },
  optimizeDeps: {
    include: ['three'],
    exclude: ['@mediapipe/hands', '@mediapipe/camera_utils']
  }
});

import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'web',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'web/index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  define: {
    // Ensure Supabase config is available globally
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://oydyrdcnoygrzjapanbd.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZHlyZGNub3lncnpqYXBhbmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTE1MjIsImV4cCI6MjA4MjA2NzUyMn0.lvQkpUe4tSbElwKjUCz75RISH6E59U1JGuYZU9wDuDo')
  }
});

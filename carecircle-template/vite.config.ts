import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    root: '.',
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        }
      }
    },
    resolve: {
      alias: {
        'react-native': 'react-native-web',
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.jsx', '.web.js', '.jsx', '.js']
    },
    define: {
      global: 'window',
      'process.env': {
        EXPO_PUBLIC_SUPABASE_URL: env.VITE_SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL || '',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
      }
    }
  };
});
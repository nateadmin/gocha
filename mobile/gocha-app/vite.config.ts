import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = __dirname;
const rnWebRoot = path.resolve(projectRoot, 'node_modules/react-native-web');

export default defineConfig({
  root: path.resolve(projectRoot, 'web'),
  publicDir: path.resolve(projectRoot, 'assets/branding'),
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': rnWebRoot,
      'expo-font': path.resolve(projectRoot, 'web/stubs/expo-font.ts'),
    },
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
  },
  define: {
    global: 'window',
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['react-native-web'],
    esbuildOptions: {
      resolveExtensions: [
        '.web.js',
        '.web.jsx',
        '.web.ts',
        '.web.tsx',
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
      ],
      loader: {
        '.js': 'jsx',
      },
    },
  },
});

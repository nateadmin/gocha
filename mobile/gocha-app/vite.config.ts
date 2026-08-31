import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = __dirname;
const rnWebRoot = path.resolve(projectRoot, 'node_modules/react-native-web');
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  root: projectRoot,
  publicDir: path.resolve(projectRoot, 'assets/branding'),
  plugins: [
    react({
      babel: {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      'react-native': rnWebRoot,
      'expo-font': path.resolve(projectRoot, 'web/stubs/expo-font.ts'),
      '@expo/vector-icons/Ionicons': path.resolve(projectRoot, 'web/Ionicons.tsx'),
      [path.resolve(projectRoot, 'src/theme/fonts.ts')]: path.resolve(
        projectRoot,
        'src/theme/fonts.web.ts',
      ),
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
    open: false,
  },
  optimizeDeps: {
    include: ['react-native-web', '@expo/vector-icons', 'firebase/app', 'firebase/auth'],
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
  build: {
    outDir: path.resolve(projectRoot, 'web/dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(projectRoot, 'web/index.html'),
    },
  },
});

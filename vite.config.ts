import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'node22',
    ssr: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'dotenv',
        'dayjs',
        'googleapis',
        'axios',
        'csv-parse',
        'csv-stringify',
        'fs',
        'path',
        'http',
        'url',
        'stream',
        'util',
        'crypto',
        /^node:/,
      ],
      output: {
        banner: '#!/usr/bin/env node',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});

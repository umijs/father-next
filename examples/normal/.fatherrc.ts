import { defineConfig } from 'father';
const path = require('path');

export default defineConfig({
  esm: {},
  cjs: {},
  umd: {},
  alias: {
    '@': path.resolve(__dirname, './src'),
    'hello-a': path.resolve(__dirname, './src/a.ts'),
  },
  platform: 'browser',
});

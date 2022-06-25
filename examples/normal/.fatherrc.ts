import { defineConfig } from '../../src/defineConfig';
const path = require('path');

export default defineConfig({
  esm: {},
  cjs: {},
  umd: {},
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
  platform: 'browser',
});

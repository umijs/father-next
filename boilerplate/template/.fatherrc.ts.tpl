import { defineConfig } from 'father';

export default defineConfig({
  {{#isBothNodeBrowser}}esm: {},
  cjs: {},{{/isBothNodeBrowser}}{{#isNode}}cjs: {},{{/isNode}}{{#isBrowser}}esm: {},{{/isBrowser}}
  prebundle: {},
});

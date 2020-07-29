export default {
  platform: 'browser',
  //  bundle: true,
  formats: ['cjs', 'esm', ['umd', { globalName: 'foooo' }]],
};

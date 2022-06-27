export default (files: Record<string, string>) => {
  expect(files['cjs/index.js']).not.toContain('@/');
  expect(files['cjs/index.d.ts']).not.toContain('@/');
  expect(files['esm/index.js']).not.toContain('@/');
  expect(files['esm/index.d.ts']).not.toContain('@/');

  expect(files['cjs/index.js']).not.toContain('@umijs/max');
  expect(files['cjs/index.d.ts']).not.toContain('@umijs/max');
  expect(files['esm/index.js']).not.toContain('@umijs/max');
  expect(files['esm/index.d.ts']).not.toContain('@umijs/max');
};

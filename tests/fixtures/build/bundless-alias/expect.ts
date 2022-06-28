export default (files: Record<string, string>) => {
  expect(files['cjs/index.js']).not.toContain('@/');
  expect(files['cjs/index.d.ts']).not.toContain('@/');
  expect(files['esm/index.js']).not.toContain('@/');
  expect(files['esm/index.d.ts']).not.toContain('@/');

  expect(files['cjs/index.js']).not.toContain('@umi/config');
  expect(files['cjs/index.js']).not.toContain('hello.config.ts');
  expect(files['cjs/index.js']).not.toContain('@umi/foo');
  expect(files['cjs/index.js']).not.toContain('foo.tsx');
  expect(files['cjs/index.js']).not.toContain('@umi/bar');
  expect(files['cjs/index.js']).not.toContain('bar.jsx');

  expect(files['esm/index.js']).not.toContain('@umi/config');
  expect(files['esm/index.js']).not.toContain('hello.config.ts');
  expect(files['esm/index.js']).not.toContain('@umi/foo');
  expect(files['esm/index.js']).not.toContain('foo.tsx');
  expect(files['esm/index.js']).not.toContain('@umi/bar');
  expect(files['esm/index.js']).not.toContain('bar.jsx');
};

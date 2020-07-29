import { addHook } from 'pirates';
import { transformSync } from 'esbuild';
import { transform as transformImports } from 'sucrase';
import { CONFIG_FILE } from './constants';

export function register() {
  // esm -> cjs
  // require = require('esm')(module /*, options*/);

  // ts support with esbuild
  addHook(
    (code, fileName) => {
      let { js } = transformSync(code, {
        sourcefile: fileName,
        loader: 'tsx',
        target: 'node10',
      });

      js = transformImports(js, {
        transforms: ['imports'],
      }).code;

      return js;
    },
    {
      matcher: (file) => {
        return file.endsWith(CONFIG_FILE);
      },
      exts: ['.ts'],
    },
  );
}

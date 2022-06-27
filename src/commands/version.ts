import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'version',
    alias: 'v',
    description: 'show father version',
    fn({ args }) {
      const version = require('../../package.json').version;
      if (!args.quiet) {
        const versions = [`father@${version}`];
        // parts version
        const parts = [
          '@vercel/ncc',
          '@babel/core',
          'esbuild',
          'webpack',
          'typescript',
          '@microsoft/api-extractor',
        ];

        parts.forEach((part) => {
          let version = 'unknown';
          try {
            // try require part package
            version = require(`${part}/package.json`).version;
          } catch (error) {
            // try find part version from @umijs/bundler-utils or @umijs/bundler-webpackpackage.json
            const utilsPkg = require('@umijs/bundler-utils/package.json');
            const webpackPkg = require('@umijs/bundler-webpack/package.json');
            version =
              utilsPkg.devDependencies[part] ||
              utilsPkg.dependencies[part] ||
              webpackPkg.devDependencies[part] ||
              webpackPkg.dependencies[part] ||
              version;
          }
          versions.push(`${part}@${version}`);
        });
        versions.forEach((version) => {
          console.log(version);
        });
      }
      return version;
    },
  });
};

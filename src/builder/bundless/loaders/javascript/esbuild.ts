import { build } from '@umijs/bundler-utils/compiled/esbuild';
import { winPath } from '@umijs/utils';
import path from 'path';
import { IFatherBundlessConfig, IFatherPlatformTypes } from '../../../../types';
import type { IJSTransformer } from '../types';
import { removeExtension } from './utils';

/**
 * create a replacer for transform alias path to relative path
 */
function createAliasReplacer(opts: { alias: IFatherBundlessConfig['alias'] }) {
  const alias = opts.alias || {};

  return function replacer(context: string, request: string) {
    let absReq = '';

    for (const rule in alias) {
      // replace prefix
      if (request.startsWith(`${rule}/`)) {
        absReq = path.join(alias[rule], request.slice(rule.length + 1));
        break;
      }

      // replace full path
      if (request === rule) {
        absReq = alias[rule];
        break;
      }
    }

    // transform to relative path
    if (absReq) {
      let rltReq = winPath(path.relative(context, absReq));

      // If the file suffix is js remove the suffix
      if (/\.(t|j)sx?$/.test(rltReq)) {
        rltReq = removeExtension(rltReq);
      }

      return rltReq.startsWith('..') ? rltReq : `./${rltReq}`;
    }

    return request;
  };
}

/**
 * esbuild transformer
 */
const esbuildTransformer: IJSTransformer = async function () {
  const replacer = createAliasReplacer({ alias: this.config.alias });

  const {
    outputFiles: [result],
  } = await build({
    // do not emit file
    write: false,
    // enable bundle for trigger onResolve hook, but all deps will be externalized
    bundle: true,
    format: this.config.format,
    define: this.config.define,
    target:
      this.config.platform === IFatherPlatformTypes.NODE ? 'node14' : 'es6',
    // esbuild need relative entry path
    entryPoints: [path.relative(this.paths.cwd, this.paths.fileAbsPath)],
    absWorkingDir: this.paths.cwd,
    plugins: [
      {
        name: 'plugin-father-alias',
        setup: (builder) => {
          builder.onResolve({ filter: /.*/ }, (args) => {
            if (args.kind === 'entry-point') {
              // skip entry point
              return { path: path.join(args.resolveDir, args.path) };
            } else if (args.path.startsWith('.')) {
              // skip relative module
              return { path: args.path, external: true };
            }

            // try to replace alias to relative path
            return {
              path: replacer(args.resolveDir, args.path),
              external: true,
            };
          });
        },
      },
    ],
  });

  return result.text;
};

export default esbuildTransformer;

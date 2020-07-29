import { basename, extname } from 'path';

export function getFileName(
  entryPoint: string,
  opts: { formatType: IFormatType; minify?: boolean; mjs?: boolean },
) {
  const name = basename(entryPoint, extname(entryPoint));
  return [
    name,
    opts.formatType === 'esm' && '.esm',
    opts.formatType === 'umd' && '.umd',
    opts.minify && '.min',
    opts.mjs ? '.mjs' : '.js',
  ]
    .filter(Boolean)
    .join('');
}

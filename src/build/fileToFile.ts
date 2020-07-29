import { extname, join, dirname } from 'path';
import { transformSync } from 'esbuild';
import { transform as transformImports } from 'sucrase';
import glob from 'glob';
import {
  copyFileSync,
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'fs';
import mkdirp from 'mkdirp';
import chokidar from 'chokidar';
import { DEFAULT_GLOB_IGNORED } from '../constants';

export default async function (opts: {
  cwd: string;
  formatType: IFormatType;
  onUpdate: Function;
  watch?: boolean;
}) {
  const { cwd, formatType } = opts;
  const targetDir = formatType === 'esm' ? 'es' : 'lib';
  const targetPath = join(cwd, targetDir);
  const srcPath = join(cwd, 'src');

  const files = glob.sync('**/*', {
    cwd: srcPath,
    ignore: DEFAULT_GLOB_IGNORED,
  });
  opts.onUpdate({
    total: files.length,
  });

  let completed = 0;
  for (const relFilePath of files) {
    const filePath = join(srcPath, relFilePath);
    try {
      await transform({ filePath });
      completed += 1;
      opts.onUpdate({
        completed,
        ...(completed === files.length && !opts.watch
          ? { status: 'success' }
          : {}),
      });
    } catch (e) {
      opts.onUpdate({
        completed: ++completed,
        error: {
          key: filePath,
          error: e,
        },
      });
    }
  }

  if (opts.watch) {
    const watcher = chokidar.watch('**/*', {
      cwd: srcPath,
      ignored: DEFAULT_GLOB_IGNORED,
      ignoreInitial: true,
    });
    watcher.on('all', (event, relFilePath) => {
      (async () => {
        const filePath = join(srcPath, relFilePath);
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          completed -= 1;
          opts.onUpdate({
            completed,
          });
          try {
            await transform({
              filePath,
            });
            completed += 1;
            opts.onUpdate({
              completed,
              removeError: filePath,
            });
          } catch (e) {
            completed += 1;
            opts.onUpdate({
              completed,
              error: {
                key: filePath,
                error: e,
              },
            });
          }
        }
      })();
    });
    opts.onUpdate({
      status: 'watch',
    });
  }

  async function transform(opts: { filePath: string }) {
    if (/\.(ts|js)x?$/.test(opts.filePath) && !/\.d\.ts$/.test(opts.filePath)) {
      await transformJS({ filePath: opts.filePath });
    } else {
      await copyFile({ filePath: opts.filePath });
    }
  }

  async function copyFile(opts: { filePath: string }) {
    const targetFilePath = join(
      targetPath,
      opts.filePath.replace(srcPath + '/', ''),
    );
    copyFileSync(opts.filePath, targetFilePath);
  }

  async function transformJS(opts: { filePath: string }) {
    const contents = readFileSync(opts.filePath, 'utf-8');

    let { js } = transformSync(contents, {
      sourcefile: opts.filePath,
      loader: 'tsx',
      target: 'node10',
      logLevel: 'silent',
    });

    if (formatType === 'cjs') {
      js = transformImports(js, {
        transforms: ['imports'],
      }).code;
    }

    const targetFilePath = join(
      targetPath,
      opts.filePath.replace(srcPath + '/', ''),
    ).replace(extname(opts.filePath), '.js');
    mkdirp.sync(dirname(targetFilePath));
    writeFileSync(targetFilePath, js, 'utf-8');
  }
}

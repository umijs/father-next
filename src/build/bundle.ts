import { BuildResult, buildSync } from 'esbuild';
import { join } from 'path';
import { TextDecoder } from 'util';
import { existsSync, writeFileSync } from 'fs';
import mkdirp from 'mkdirp';
import chokidar from 'chokidar';
import { DEFAULT_ERROR_KEY } from '../constants';

export default async function bundle(opts: {
  cwd: string;
  formatType: IFormatType;
  platform: IPlatform;
  entryPoint: string;
  targetFilePath: string;
  watch?: boolean;
  globalName?: string;
  onUpdate: Function;
}) {
  transform();

  // start watch
  const watcher = chokidar.watch(join(opts.cwd, 'src/**/*'), {
    ignoreInitial: true,
  });
  watcher.on('all', (event, filePath) => {
    transform();
  });
  opts.onUpdate({
    status: 'watch',
  });

  function transform() {
    let result: BuildResult | undefined;

    try {
      result = buildSync({
        entryPoints: [join(opts.cwd, opts.entryPoint)],
        format: opts.formatType === 'umd' ? 'iife' : opts.formatType,
        platform: opts.platform,
        globalName: opts.globalName,
        external: [],
        define: {},
        write: false,
        bundle: true,
        target: 'es2015',
        logLevel: 'silent',
      });
      opts.onUpdate({
        status: 'success',
        removeError: DEFAULT_ERROR_KEY,
      });
    } catch (e) {
      opts.onUpdate({
        status: 'fail',
        error: {
          key: DEFAULT_ERROR_KEY,
          error: e,
        },
      });
    }

    if (result?.outputFiles) {
      const file = result.outputFiles[0];
      const textDecoder = new TextDecoder('utf-8');
      const contents = textDecoder.decode(file.contents);
      if (!existsSync(join(opts.cwd, 'dist'))) {
        mkdirp.sync(join(opts.cwd, 'dist'));
      }
      writeFileSync(join(opts.cwd, opts.targetFilePath), contents, 'utf-8');
    }
  }
}

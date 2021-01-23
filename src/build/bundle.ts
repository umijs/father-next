import chokidar from 'chokidar';
import { BuildResult, buildSync } from 'esbuild';
import { writeFileSync } from 'fs';
import mkdirp from 'mkdirp';
import { dirname, join } from 'path';
import { TextDecoder } from 'util';
import { DEFAULT_ERROR_KEY } from '../constants';
import { getExternal } from '../utils/getExternal';

export default async function (opts: {
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

  if (opts.watch) {
    const watcher = chokidar.watch(join(opts.cwd, 'src/**/*'), {
      ignoreInitial: true,
    });
    watcher.on('all', (event, filePath) => {
      transform();
    });
    opts.onUpdate({
      status: 'watch',
    });
  }

  function transform() {
    let result: BuildResult | undefined;

    try {
      result = buildSync({
        entryPoints: [join(opts.cwd, opts.entryPoint)],
        format: opts.formatType === 'umd' ? 'iife' : opts.formatType,
        platform: opts.platform,
        globalName: opts.globalName,
        external: getExternal({ cwd: opts.cwd, formatType: opts.formatType }),
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
      const target = join(opts.cwd, opts.targetFilePath);
      mkdirp.sync(dirname(target));
      writeFileSync(target, contents, 'utf-8');
    }
  }
}

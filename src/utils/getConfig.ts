import { existsSync } from 'fs';
import { join } from 'path';
import { CONFIG_FILE } from '../constants';

export async function getConfig(opts: { cwd: string }): Promise<IConfig> {
  const configFile = join(opts.cwd, CONFIG_FILE);
  if (existsSync(configFile)) {
    // support ts syntax within ./register.ts (esbuild + esm)
    return require(configFile);
  } else {
    return {};
  }
}

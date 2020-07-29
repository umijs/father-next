import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export function getLernaPackages(opts: { cwd: string }): string[] {
  return readdirSync(join(opts.cwd, 'packages'))
    .filter((p) => {
      return (
        p.charAt(0) !== '.' &&
        statSync(join(opts.cwd, 'packages', p)).isDirectory() &&
        existsSync(join(opts.cwd, 'packages', p, 'package.json'))
      );
    })
    .map((p) => join('packages', p));
}

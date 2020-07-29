import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

export function getExternal(opts: {
  cwd: string;
  formatType: IFormatType;
}): string[] {
  const pkgFile = join(opts.cwd, 'package.json');
  if (!existsSync(pkgFile)) return [];
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf-8'));
  return [
    ...(opts.formatType !== 'umd' ? Object.keys(pkg.dependencies || {}) : []),
    ...Object.keys(pkg.peerDependencies || {}),
  ];
}

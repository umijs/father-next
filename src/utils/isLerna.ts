import { existsSync } from 'fs';
import { join } from 'path';

export function isLerna(cwd: string) {
  return existsSync(join(cwd, 'lerna.json'));
}

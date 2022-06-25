import { IApi } from '../types';
import { logger } from '@umijs/utils';

export default (api: IApi) => {
  api.registerCommand({
    name: 'version',
    alias: 'v',
    description: 'show father version',
    fn({ args }) {
      const version = require('../../package.json').version;
      if (!args.quiet) {
        const versions: string[] = [`father@${version}`];
        // parts version
        const parts: any = [
          '@vercel/ncc',
          'babel',
          'esbuild',
          'webpack',
          'typescript',
          '@microsoft/api-extractor',
        ];

        parts.forEach((part: string) => {
          try {
            // parts may not exist
            versions.push(`${part}@${require(`${part}/package.json`).version}`);
          } catch (error) {}
        });
        versions.forEach((version) => {
          logger.info(`Version: ${version}`);
        });
      }
      return version;
    },
  });
};

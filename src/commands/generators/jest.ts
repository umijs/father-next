import { GeneratorType } from '@umijs/core';
import { logger } from '@umijs/utils';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { IApi } from '../../types';
import { GeneratorHelper, promptsExitWhenCancel } from './utils';

export default (api: IApi) => {
  api.describe({
    key: 'generator:jest',
  });

  api.registerGenerator({
    key: 'jest',
    name: 'Enable Jest',
    description: 'Setup Jest Configuration',
    type: GeneratorType.enable,
    checkEnable: () => {
      return (
        !existsSync(join(api.paths.cwd, 'jest.config.ts')) &&
        !existsSync(join(api.paths.cwd, 'jest.config.js'))
      );
    },
    disabledDescription:
      'Jest has already enabled. You can remove jest.config.{ts,js}, then run this again to re-setup.',
    fn: async () => {
      const h = new GeneratorHelper(api);

      const res = await promptsExitWhenCancel({
        type: 'confirm',
        name: 'useRTL',
        message: 'Will you use @testing-library/react for UI testing?',
        initial: true,
      });

      const hasSrc = api.paths.absSrcPath.endsWith('src');

      const basicDeps = {
        jest: '^27',
        '@types/jest': '^27',
        // we use `jest.config.ts` so jest needs ts and ts-node
        typescript: '^4',
        'ts-node': '^10',
        '@umijs/test': '^4',
      };

      const deps: Record<string, string> = res.useRTL
        ? {
            ...basicDeps,
            '@testing-library/react': '^13',
            '@testing-library/jest-dom': '^5.16.4',
            '@types/testing-library__jest-dom': '^5.14.5',
          }
        : basicDeps;

      h.addDevDeps(deps);
      h.addScript('test', 'jest');

      if (res.useRTL) {
        writeFileSync(
          join(api.cwd, 'jest-setup.ts'),
          `import '@testing-library/jest-dom';
          `.trimStart(),
        );
        logger.info('Write jest-setup.ts');
      }

      const collectCoverageFrom = hasSrc
        ? [
            'src/**/*.{ts,js,tsx,jsx}',
            '!src/.umi/**',
            '!src/.umi-test/**',
            '!src/.umi-production/**',
          ]
        : [
            '**/*.{ts,tsx,js,jsx}',
            '!.umi/**',
            '!.umi-test/**',
            '!.umi-production/**',
            '!.umirc.{js,ts}',
            '!.umirc.*.{js,ts}',
            '!jest.config.{js,ts}',
            '!coverage/**',
            '!dist/**',
            '!config/**',
            '!mock/**',
          ];

      writeFileSync(
        join(api.cwd, 'jest.config.ts'),
        `
import { Config, createConfig } from '@umijs/test';

export default {
  ...createConfig(),${
    res.useRTL
      ? `
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],`
      : ''
  }
  collectCoverageFrom: [${collectCoverageFrom.map((v) => `'${v}'`).join(', ')}],
} as Config.InitialOptions;
`.trimStart(),
      );

      logger.info('Write jest.config.ts');

      h.installDeps();
    },
  });
};
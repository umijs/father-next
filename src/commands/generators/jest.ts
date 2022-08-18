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

      const basicDeps = {
        jest: '^27',
        '@types/jest': '^27',
        '@types/node': '^18',
        // we use `jest.config.ts` so jest needs ts and ts-node
        typescript: '^4',
        'ts-node': '^10',
        'ts-jest': '^27',
        'jest-watch-typeahead': '^1.1.0',
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

      writeFileSync(
        join(api.cwd, 'jest.config.ts'),
        `
module.exports = {
  preset: 'ts-jest',${
    api.appData.config.platform !== 'node'
      ? `
  testEnvironment: 'jsdom',`
      : ''
  }
  moduleDirectories: ['node_modules'], ${
    res.useRTL
      ? `
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],`
      : ''
  }
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,jsx,ts,tsx}',
  ],
};`.trimStart(),
      );

      logger.info('Write jest.config.ts');

      h.installDeps();
    },
  });
};

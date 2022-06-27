import path from 'path';
import { Minimatch } from 'minimatch';
import { logger, winPath } from '@umijs/utils';
import {
  IApi,
  IFatherBaseConfig,
  IFatherBuildTypes,
  IFatherBundleConfig,
  IFatherBundlessConfig,
  IFatherBundlessTypes,
  IFatherConfig,
  IFatherJSTransformerTypes,
  IFatherPlatformTypes,
} from '../types';
import { loadConfig } from 'tsconfig-paths';
import * as MappingEntry from 'tsconfig-paths/lib/mapping-entry';

/**
 * declare bundler config
 */
export interface IBundleConfig
  extends IFatherBaseConfig,
    Omit<IFatherBundleConfig, 'entry' | 'output'> {
  type: IFatherBuildTypes.BUNDLE;
  bundler: 'webpack';
  entry: string;
  output: {
    filename: string;
    path: string;
  };
}

/**
 * declare bundless config
 */
export interface IBundlessConfig
  extends IFatherBaseConfig,
    Omit<IFatherBundlessConfig, 'input' | 'overrides'> {
  type: IFatherBuildTypes.BUNDLESS;
  format: IFatherBundlessTypes;
  input: string;
}

/**
 * declare union builder config
 */
export type IBuilderConfig = IBundleConfig | IBundlessConfig;

/**
 * generate bundle filename by package name
 */
function getAutoBundleFilename(pkgName?: string) {
  return pkgName ? pkgName.replace(/^@[^/]+\//, '') : 'index';
}

/**
 *
 * convert alias from tsconfig paths
 * @export
 * @param {string} cwd
 */
export function convertAliasByTsconfigPaths(cwd: string) {
  const config = loadConfig(cwd);
  let alias: Record<string, string> = {};

  if (config.resultType === 'success') {
    const { absoluteBaseUrl, paths } = config;
    logger.info(`convert tsconfig paths to alias`);

    let absolutePaths = MappingEntry.getAbsoluteMappingEntries(
      absoluteBaseUrl,
      paths,
      true,
    );

    absolutePaths = absolutePaths.filter((path) => path.pattern !== '*');

    absolutePaths.forEach((entry) => {
      const [physicalPathPattern] = entry.paths;
      if (entry.pattern.endsWith(winPath('/*'))) {
        alias[entry.pattern.replace(winPath('/*'), '')] =
          physicalPathPattern.replace(winPath('/*'), '');
      } else {
        alias[entry.pattern] = physicalPathPattern;
      }
    });

    logger.debug('absolutePaths', paths, absolutePaths);
  }

  return alias;
}

/**
 * normalize user config to bundler configs
 * @param userConfig  config from user
 */
export function normalizeUserConfig(
  userConfig: IFatherConfig,
  pkg: IApi['pkg'],
) {
  const configs: IBuilderConfig[] = [];
  const { umd, esm, cjs, ...baseConfig } = userConfig;

  // normalize umd config
  if (umd) {
    const entryConfig = umd.entry;
    const bundleConfig: Omit<IBundleConfig, 'entry'> = {
      type: IFatherBuildTypes.BUNDLE,
      bundler: 'webpack',
      ...baseConfig,

      // override base configs from umd config
      ...umd,

      // generate default output
      output: {
        // default to generate filename from package name
        filename: `${getAutoBundleFilename(pkg.name)}.min.js`,
        // default to output dist
        path: umd.output || 'dist/umd',
      },
    };

    if (typeof entryConfig === 'object') {
      // extract multiple entries to single configs
      Object.keys(entryConfig).forEach((entry) => {
        configs.push({
          ...bundleConfig,

          // override all configs from entry config
          ...entryConfig[entry],
          entry,

          // override output
          output: {
            filename: `${path.parse(entry).name}.min.js`,
            path: entryConfig[entry].output || bundleConfig.output.path,
          },
        });
      });
    } else {
      // generate single entry to single config
      configs.push({
        ...bundleConfig,

        // default to bundle src/index
        entry: entryConfig || 'src/index',
      });
    }
  }

  // normalize esm config
  Object.entries({
    ...(esm ? { esm } : {}),
    ...(cjs ? { cjs } : {}),
  }).forEach(([formatName, formatConfig]) => {
    const { overrides = {}, ...esmBaseConfig } = formatConfig;
    const defaultPlatform =
      formatName === 'esm'
        ? IFatherPlatformTypes.BROWSER
        : IFatherPlatformTypes.NODE;
    const bundlessConfig: Omit<IBundlessConfig, 'input'> = {
      type: IFatherBuildTypes.BUNDLESS,
      format: formatName as IFatherBundlessTypes,
      platform: userConfig.platform || defaultPlatform,
      ...baseConfig,
      ...esmBaseConfig,
    };

    // generate config for input
    const rootConfig = {
      // default to transform src
      input: 'src',

      // default to output to dist
      output: `dist/${formatName}`,

      // default to use auto transformer
      transformer:
        bundlessConfig.platform === IFatherPlatformTypes.NODE
          ? IFatherJSTransformerTypes.ESBUILD
          : IFatherJSTransformerTypes.BABEL,

      ...bundlessConfig,

      // transform overrides inputs to ignores
      ignores: Object.keys(overrides)
        .map((i) => `${i}/**`)
        .concat(bundlessConfig.ignores || []),
    };
    configs.push(rootConfig);

    // generate config for overrides
    Object.keys(overrides).forEach((oInput) => {
      const overridePlatform =
        overrides[oInput].platform || bundlessConfig.platform;

      // validate override input
      if (!oInput.startsWith(`${rootConfig.input}/`)) {
        throw new Error(
          `Override input ${oInput} must be a subpath of ${formatName}.input!`,
        );
      }

      configs.push({
        // default to use auto transformer
        transformer:
          overridePlatform === IFatherPlatformTypes.NODE
            ? IFatherJSTransformerTypes.ESBUILD
            : IFatherJSTransformerTypes.BABEL,

        // default to output relative root config
        output: `${rootConfig.output}/${winPath(
          path.relative(rootConfig.input, oInput),
        )}`,

        ...bundlessConfig,

        // override all configs for different input
        ...overrides[oInput],

        // specific different input
        input: oInput,

        // transform another child overrides to ignores
        // for support to transform src/a and src/a/child with different configs
        ignores: Object.keys(overrides)
          .filter((i) => !i.startsWith(oInput))
          .map((i) => `${i}/**`)
          .concat(bundlessConfig.ignores || []),
      });
    });
  });

  return configs;
}

class Minimatcher {
  matcher?: InstanceType<typeof Minimatch>;

  ignoreMatchers: InstanceType<typeof Minimatch>[] = [];

  constructor(pattern: string, ignores: string[] = []) {
    this.matcher = new Minimatch(`${pattern}/**`);
    ignores.forEach((i) => {
      this.ignoreMatchers.push(new Minimatch(i, { dot: true }));

      // see also: https://github.com/isaacs/node-glob/blob/main/common.js#L37
      if (i.slice(-3) === '/**') {
        this.ignoreMatchers.push(
          new Minimatch(i.replace(/(\/\*\*)+$/, ''), { dot: true }),
        );
      }
    });
  }

  match(filePath: string) {
    return (
      this.matcher!.match(filePath) &&
      this.ignoreMatchers.every((m) => !m.match(filePath))
    );
  }
}

class ConfigProvider {
  pkg: ConstructorParameters<typeof ConfigProvider>[0];

  constructor(pkg: IApi['pkg']) {
    this.pkg = pkg;
  }

  onConfigChange() {
    // not implemented
  }
}

export class BundleConfigProvider extends ConfigProvider {
  type = IFatherBuildTypes.BUNDLE;

  configs: IBundleConfig[] = [];

  constructor(
    configs: IBundleConfig[],
    pkg: ConstructorParameters<typeof ConfigProvider>[0],
  ) {
    super(pkg);
    this.configs = configs;
  }
}

export class BundlessConfigProvider extends ConfigProvider {
  type = IFatherBuildTypes.BUNDLESS;

  configs: IBundlessConfig[] = [];

  input = '';

  output = '';

  matchers: InstanceType<typeof Minimatcher>[] = [];

  constructor(
    configs: IBundlessConfig[],
    pkg: ConstructorParameters<typeof ConfigProvider>[0],
  ) {
    super(pkg);
    this.configs = configs;
    this.input = configs[0].input;
    this.output = configs[0].output!;
    configs.forEach((config) => {
      this.matchers.push(new Minimatcher(config.input, config.ignores));
    });
  }

  getConfigForFile(filePath: string) {
    return this.configs[this.matchers.findIndex((m) => m.match(filePath))];
  }
}

export function createConfigProviders(
  userConfig: IFatherConfig,
  pkg: IApi['pkg'],
  cwd: string,
) {
  const providers: {
    bundless: { esm?: BundlessConfigProvider; cjs?: BundlessConfigProvider };
    bundle?: BundleConfigProvider;
  } = { bundless: {} };
  const configs = normalizeUserConfig(userConfig, pkg);

  // convert alias from tsconfig paths
  const alias = convertAliasByTsconfigPaths(cwd);
  logger.debug('tconfig alias', alias);

  const { bundle, bundless } = configs.reduce(
    (r, config) => {
      config.alias = { ...config.alias, ...(alias || {}) };

      if (config.type === IFatherBuildTypes.BUNDLE) {
        r.bundle.push(config);
      } else if (config.type === IFatherBuildTypes.BUNDLESS) {
        r.bundless[config.format].push(config);
      }

      return r;
    },
    { bundle: [], bundless: { esm: [], cjs: [] } } as {
      bundle: IBundleConfig[];
      bundless: { esm: IBundlessConfig[]; cjs: IBundlessConfig[] };
    },
  );

  if (bundle.length) {
    providers.bundle = new BundleConfigProvider(bundle, pkg);
  }

  if (bundless.cjs.length) {
    providers.bundless.cjs = new BundlessConfigProvider(bundless.cjs, pkg);
  }

  if (bundless.esm.length) {
    providers.bundless.esm = new BundlessConfigProvider(bundless.esm, pkg);
  }

  return providers;
}

import { glob, lodash } from '@umijs/utils';
import fs from 'fs';
import path from 'path';
import {
  IBundleConfig,
  IBundlessConfig,
  normalizeUserConfig as getBuildConfig,
} from '../builder/config';
import { DEFAULT_BUNDLESS_IGNORES } from '../constants';
import { getConfig as getPreBundleConfig } from '../prebundler/config';
import { IFatherBuildTypes, type IApi } from '../types';

export type IDoctorReport = {
  type: 'error' | 'warn';
  problem: string;
  solution: string;
}[];

/**
 * register all built-in rules
 */
export function registerRules(api: IApi) {
  const ruleDir = path.join(__dirname, 'rules');
  const rules = fs
    .readdirSync(ruleDir, { withFileTypes: true })
    .filter((f) => f.isFile() && /(?<!\.d)\.(j|t)s$/.test(f.name))
    .map((f) => path.join(ruleDir, f.name));

  api.registerPlugins(rules);
}

/**
 * get top-level source dirs from configs
 */
export function getSourceDirs(
  bundleConfigs: IBundleConfig[],
  bundlessConfigs: IBundlessConfig[],
) {
  const configDirs = lodash.uniq([
    ...bundleConfigs.map((c) => path.dirname(c.entry)),
    ...bundlessConfigs.map((c) => c.input),
  ]);

  return [...configDirs].filter((d, i) =>
    configDirs.every((dir, j) => i === j || !d.startsWith(dir)),
  );
}

export default async (api: IApi): Promise<IDoctorReport> => {
  // generate configs
  const [bundleConfigs, bundlessConfigs] = getBuildConfig(
    api.config,
    api.pkg,
  ).reduce<[IBundleConfig[], IBundlessConfig[]]>(
    (ret, config) => {
      if (config.type === IFatherBuildTypes.BUNDLE) {
        ret[0].push(config);
      } else {
        ret[1].push(config);
      }

      return ret;
    },
    [[], []],
  );
  const preBundleConfig = getPreBundleConfig({
    userConfig: api.config.prebundle || {},
    pkg: api.pkg,
    cwd: api.cwd,
  });

  // collect all source files
  const sourceDirs = getSourceDirs(bundleConfigs, bundlessConfigs);
  const sourceFiles = sourceDirs.reduce<string[]>(
    (ret, dir) =>
      ret.concat(
        glob.sync(`${dir}/**`, {
          cwd: api.cwd,
          ignore: DEFAULT_BUNDLESS_IGNORES,
          nodir: true,
        }),
      ),
    [],
  );

  // regular checkup
  const regularReport: IDoctorReport = await api.applyPlugins({
    key: 'addRegularCheckup',
    args: { bundleConfigs, bundlessConfigs, preBundleConfig },
  });

  // source checkup
  const sourceReport: IDoctorReport = [];

  for (const file of sourceFiles) {
    sourceReport.push(
      ...(await api.applyPlugins({
        key: 'addSourceCheckup',
        args: {
          file,
          content: fs.readFileSync(path.join(api.cwd, file), 'utf-8'),
        },
      })),
    );
  }

  return [...regularReport.filter(Boolean), ...sourceReport.filter(Boolean)];
};

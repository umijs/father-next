import fs from 'fs';
import path from 'path';
import {
  IBundleConfig,
  IBundlessConfig,
  normalizeUserConfig as getBuildConfig,
} from '../builder/config';
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

  // regular checkup
  const regularReport: IDoctorReport = await api.applyPlugins({
    key: 'addRegularCheckup',
    type: api.ApplyPluginsType.add,
    args: { bundleConfigs, bundlessConfigs, preBundleConfig },
  });

  return [...regularReport.filter(Boolean)];
};

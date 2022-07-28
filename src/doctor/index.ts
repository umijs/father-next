import fs from 'fs';
import path from 'path';
import { type IApi } from '../types';

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
  api;
  return [];
};

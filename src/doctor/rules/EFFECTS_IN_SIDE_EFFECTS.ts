import type { IDoctorReport } from '..';
import type { IApi } from '../../types';

export default (api: IApi) => {
  api.addRegularCheckup(() => {
    if (Array.isArray(api.pkg.sideEffects)) {
      const result: IDoctorReport = [];

      api.pkg.sideEffects.forEach((s) => {
        if (s.startsWith('*.')) {
          result.push({
            type: 'warn',
            problem: `The \`${s}\` sideEffect syntax only match top-level files in Rollup.js, but match all in Webpack`,
            solution:
              'Prefix `**/` for this sideEffect value in the package.json file',
          });
        }
      });

      return result;
    }
  });
};

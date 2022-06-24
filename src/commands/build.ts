import builder from '../builder';
import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'build',
    description: 'build',
    async fn() {
      await builder({
        userConfig: api.config,
        cwd: api.cwd,
        pkg: api.pkg,
      });
    },
  });
};

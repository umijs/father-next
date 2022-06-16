import builder from '../builder';
import { unwatch } from '../builder/watch';
import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'build',
    description: 'build',
    async fn(opts) {
      const watch = opts.args.w || opts.args.watch;
      await builder({
        userConfig: api.userConfig,
        cwd: api.cwd,
        pkg: api.pkg,
        watch,
      });
      if (watch) {
        api.service.configManager!.watch({
          schemas: api.service.configSchemas,
          onChangeTypes: api.service.configOnChanges,
          async onChange() {
            unwatch();
            await builder({
              userConfig: api.userConfig,
              cwd: api.cwd,
              pkg: api.pkg,
              watch: watch,
            });
          },
        });
      }
    },
  });
};

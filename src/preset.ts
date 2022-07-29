import { IApi } from './types';

export default (api: IApi) => {
  api.onStart(() => {});
  return {
    plugins: [
      require.resolve('./registerMethods'),

      // commands
      require.resolve('./commands/dev'),
      require.resolve('./commands/doctor'),
      require.resolve('./commands/build'),
      require.resolve('./commands/changelog'),
      require.resolve('./commands/prebundle'),
      require.resolve('./commands/release'),
      require.resolve('./commands/version'),
      require.resolve('./commands/help'),

      // features
      require.resolve('./features/configBuilder/configBuilder'),
      require.resolve('./features/configPlugins/configPlugins'),
    ],
  };
};

import { IApi } from './types';

export default (api: IApi) => {
  ['addJSTransformer', 'addRegularCheckup', 'addSourceCheckup'].forEach(
    (name) => {
      api.registerMethod({ name });
    },
  );
};

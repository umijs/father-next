import { IApi } from './types';

export default (api: IApi) => {
  ['addJSTransformer', 'addRegularCheckup'].forEach((name) => {
    api.registerMethod({ name });
  });
};

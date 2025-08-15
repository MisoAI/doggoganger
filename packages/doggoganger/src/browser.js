import { Api, data } from '@miso.ai/doggoganger-api';

export default {
  buildApi: (...args) => new Api(...args),
  data,
};

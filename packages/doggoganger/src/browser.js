import Api from './api/index.js';
import * as data from './data/index.js';

export default {
  buildApi: (...args) => new Api(...args),
  data,
};

import Api from './api/index.js';

export default {
  buildApi: (...args) => new Api(...args),
};

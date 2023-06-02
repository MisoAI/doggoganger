import Api from './api/index.js';

export default doggoganger = {
  buildApi: (...args) => new Api(...args),
};

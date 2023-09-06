import Api from './api/index.js';

export default function buildApi(...args) {
  return new Api(...args);
};

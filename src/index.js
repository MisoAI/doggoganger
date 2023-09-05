export { default as doggoganger } from './doggoganger.js';
import Api from './api/index.js';

export function buildApi(...args) {
  return new Api(...args);
};

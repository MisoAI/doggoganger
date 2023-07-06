import * as fields from './fields.js';

export function *questions({ rows, ...options } = {}) {
  for (let i = 0; i < rows; i++) {
    yield question({ ...options, index: i });
  }
}

function question({} = {}) {
  return fields.description({ size: [4, 8], punctuation: '?' });
}

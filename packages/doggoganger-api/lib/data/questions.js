import { fields } from '@miso.ai/lorem';

export function *questions({ rows = 5, ...options } = {}) {
  for (let i = 0; i < rows; i++) {
    yield question({ ...options, index: i });
  }
}

function question({} = {}) {
  return fields.description({ size: [4, 8], punctuation: '?' });
}

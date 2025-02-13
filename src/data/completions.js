import * as u from './utils.js';
import * as fields from './fields.js';

export function completions({ q, completion_fields, rows } = {}) {
  let index = 0;
  const result = {};
  for (const field of completion_fields) {
    result[field] = completionsForField(field, q, index, rows);
    index += rows;
  }
  return result;
}

function completionsForField(field, q, index, rows) {
  const completions = [];
  for (let i = 0; i < rows; i++) {
    completions.push(completion(field, q, index));
  }
  return completions;
}

function completion(field, q, index) {
  const text = fields.title();
  const i = u.randomInt(0, text.length);
  const prefix = text.substring(0, i);
  const suffix = text.substring(i);
  return {
    text: `${prefix}${q}${suffix}`,
    text_with_markups: `${marked(prefix)}${q}${marked(suffix)}`,
    text_with_inverted_markups: `${prefix}${marked(q)}${suffix}`,
    _field: field,
    _index: index,
  };
}

function marked(text) {
  return text.length > 0 ? `<mark>${text}</mark>` : '';
}

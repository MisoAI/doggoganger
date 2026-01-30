export class Completions {

  constructor(data) {
    this._lorem = data._lorem;
  }

  _completions({ q, completion_fields, rows } = {}) {
    let index = 0;
    const result = {};
    for (const field of completion_fields) {
      result[field] = this._completionsForField(field, q, index, rows);
      index += rows;
    }
    return result;
  }

  _completionsForField(field, q, index, rows) {
    const completions = [];
    for (let i = 0; i < rows; i++) {
      completions.push(this._completion(field, q, index));
    }
    return completions;
  }

  _completion(field, q, index) {
    const { fields, prng } = this._lorem;

    const text = fields.title();
    const i = prng.randomInt(0, text.length);
    const prefix = text.substring(0, i);
    const suffix = text.substring(i);
    return {
      text: `${prefix}${q}${suffix}`,
      text_with_markups: `${this._marked(prefix)}${q}${this._marked(suffix)}`,
      text_with_inverted_markups: `${prefix}${this._marked(q)}${suffix}`,
      _field: field,
      _index: index,
    };
  }

  _marked(text) {
    return text.length > 0 ? `<mark>${text}</mark>` : '';
  }

}

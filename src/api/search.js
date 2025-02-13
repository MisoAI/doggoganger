import { products, completions } from '../data/index.js';

export default class Search {

  constructor(options) {
    this._options = options;
  }

  search({ rows = 5 }) {
    return {
      products: [...products({ rows })],
    };
  }

  autocomplete({ q, completion_fields = ['title'], rows = 5 }) {
    return {
      completions: completions({ q, completion_fields, rows }),
    };
  }

}

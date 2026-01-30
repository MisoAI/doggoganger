import { misoData } from '../data/index.js';

export class Search {

  constructor(options) {
    this._options = options;
  }

  search({ rows = 5, ...rest }, { seed } = {}) {
    const data = misoData({ seed });
    return {
      products: data.products({ rows }),
    };
  }

  autocomplete({ q, completion_fields = ['title'], rows = 5, ...rest }, { seed } = {}) {
    const data = misoData({ seed });
    return {
      completions: data.completions({ q, completion_fields, rows }),
    };
  }

}

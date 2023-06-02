import { products } from '../data/index.js';

export default class Search {

  constructor(options) {
    this._options = options;
  }

  search({ rows = 5 }) {
    return {
      products: [...products({ rows })],
    };
  }

}

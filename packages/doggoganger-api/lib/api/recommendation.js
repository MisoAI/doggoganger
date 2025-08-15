import { products } from '../data/index.js';

export default class Recommendation {

  constructor(options) {
    this._options = options;
  }

  user_to_products({ rows = 5 }) {
    return {
      products: [...products({ rows })],
    };
  }

  product_to_products({ rows = 5 }) {
    return {
      products: [...products({ rows })],
    };
  }

}

import { misoData } from '../data/index.js';

export class Recommendation {

  constructor(context) {
    this._context = context;
    this._options = context.options;
  }

  user_to_products({ rows = 5, ...rest }, { seed } = {}) {
    const data = misoData({ seed });
    return {
      products: data.products({ rows }),
    };
  }

  product_to_products({ rows = 5, ...rest }, { seed } = {}) {
    const data = misoData({ seed });
    return {
      products: data.products({ rows }),
    };
  }

}

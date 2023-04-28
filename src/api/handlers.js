import { products as _products } from '../data/index.js';

export function products(ctx) {
  const { rows = 5 } = JSON.parse(ctx.request.body);
  ctx.body = {
    data: {
      products: [..._products({ rows })],
    },
  };
}

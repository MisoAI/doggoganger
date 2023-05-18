import { products as _products } from '../data/index.js';
import { parseBodyIfNecessary } from './utils.js';

export function products(ctx) {
  const { rows = 5 } = parseBodyIfNecessary(ctx.request.body);
  ctx.body = {
    data: {
      products: [..._products({ rows })],
    },
  };
}

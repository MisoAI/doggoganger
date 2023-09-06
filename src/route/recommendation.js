import Router from '@koa/router';
import { handler } from './utils.js';

export default function(api) {
  const router = new Router();

  router.post('/user_to_products', handler(api.recommendation.user_to_products, 'query'));
  router.post('/product_to_products', handler(api.recommendation.product_to_products, 'query'));

  return router;
}
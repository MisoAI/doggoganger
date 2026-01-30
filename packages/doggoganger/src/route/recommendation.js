import Router from '@koa/router';
import { handler } from './utils.js';

export default function(api) {
  const router = new Router();

  router.post('/user_to_products', handler((p, o) => api.recommendation.user_to_products(p, o), 'query'));
  router.post('/product_to_products', handler((p, o) => api.recommendation.product_to_products(p, o), 'query'));

  return router;
}
import Router from '@koa/router';
import { parseBodyIfNecessary } from './utils.js';

export default function(api) {
  const router = new Router();

  router.post('/user_to_products', (ctx) => {
    const { rows = 5 } = parseBodyIfNecessary(ctx.request.body);
    ctx.body = {
      data: api.recommendation.user_to_products({ rows }),
    };
  });

  router.post('/product_to_products', (ctx) => {
    const { rows = 5 } = parseBodyIfNecessary(ctx.request.body);
    ctx.body = {
      data: api.recommendation.product_to_products({ rows }),
    };
  });

  return router;
}
import Router from '@koa/router';
import { parseBodyIfNecessary } from './utils.js';

export default function(api) {
  const router = new Router();

  router.post('/search', (ctx) => {
    const { rows = 5 } = parseBodyIfNecessary(ctx.request.body);
    ctx.body = {
      data: api.search.search({ rows }),
    };
  });

  return router;
}

import Router from '@koa/router';
import { parseBodyIfNecessary } from './utils.js';

export default function(api) {
  const router = new Router();

  router.post('/', (ctx) => {
    const { data } = parseBodyIfNecessary(ctx.request.body);
    ctx.body = {
      took: 5,
      errors: false,
      data: api.interactions.upload(data),
    };
  });

  return router;
}

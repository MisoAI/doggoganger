import Router from '@koa/router';
import { handler } from './utils.js';

export default function(api) {
  const router = new Router();

  router.post('/', handler((p, o) => api.products.upload(p, o), 'data'));
  router.post('_delete', handler((p, o) => api.products.batchDelete(p, o), 'data'));

  router.get('/_ids', (ctx) => {
    const seed = ctx.get('x-seed') || undefined;
    ctx.body = {
      message: 'success',
      data: api.products.ids({ seed }),
    };
  });

  router.get('/_status/:taskId', (ctx) => {
    ctx.body = {
      took: 100,
      errors: false,
      data: [],
      code: 200,
    };
  });

  return router;
}
